// src/services/ActionTemplateService.ts (atualização parcial)

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  writeBatch,
  where
} from 'firebase/firestore'
import { ActionTemplateSchema, TaskAction } from '../types/firestore-schema'
import { auth } from '../config/firebase'

export class ActionTemplateService {
  private db = getFirestore()
  private templatesCollection = collection(this.db, 'actionTemplates')

  // Método existente com melhorias
  async createActionTemplate(
    templateData: Omit<ActionTemplateSchema, 'id'>
  ): Promise<ActionTemplateSchema> {
    try {
      const templateRef = doc(this.templatesCollection)
      const newTemplate: ActionTemplateSchema = {
        id: templateRef.id,
        ...templateData,
        order: Date.now(),
        createdBy: auth.currentUser?.uid || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Validar dependências entre ações
      if (templateData.elements) {
        this.validateActionDependencies(templateData.elements);
      }

      await setDoc(templateRef, newTemplate)
      return newTemplate
    } catch (error) {
      console.error('Error creating action template:', error)
      throw error
    }
  }

  // Novo método para validar dependências entre ações
  private validateActionDependencies(actions: TaskAction[]): void {
    const actionIds = new Set(actions.map(action => action.id));
    
    // Verificar se todas as dependências existem
    for (const action of actions) {
      if (action.dependsOn) {
        for (const depId of action.dependsOn) {
          if (!actionIds.has(depId)) {
            throw new Error(`Action ${action.id} depends on non-existent action ${depId}`);
          }
        }
      }
      
      if (action.nextActions) {
        for (const nextId of action.nextActions) {
          if (!actionIds.has(nextId)) {
            throw new Error(`Action ${action.id} references non-existent next action ${nextId}`);
          }
        }
      }
    }
    
    // Verificar ciclos de dependência
    this.checkForDependencyCycles(actions);
  }

  // Novo método para verificar ciclos de dependência
  private checkForDependencyCycles(actions: TaskAction[]): void {
    const actionMap = new Map<string, TaskAction>();
    actions.forEach(action => actionMap.set(action.id, action));
    
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const checkCycle = (actionId: string): boolean => {
      if (!visited.has(actionId)) {
        visited.add(actionId);
        recursionStack.add(actionId);
        
        const action = actionMap.get(actionId);
        if (action?.nextActions) {
          for (const nextId of action.nextActions) {
            if (!visited.has(nextId) && checkCycle(nextId)) {
              return true;
            } else if (recursionStack.has(nextId)) {
              throw new Error(`Dependency cycle detected involving action ${actionId} and ${nextId}`);
            }
          }
        }
        
        recursionStack.delete(actionId);
      }
      return false;
    };
    
    for (const action of actions) {
      if (!visited.has(action.id)) {
        checkCycle(action.id);
      }
    }
  }

  // Novo método para clonar um template
  async cloneTemplate(templateId: string, newTitle?: string): Promise<ActionTemplateSchema> {
    try {
      const template = await this.getActionTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Criar novos IDs para todas as ações
      const idMap = new Map<string, string>();
      const newElements = template.elements.map(action => {
        const newId = Date.now().toString() + Math.random().toString(36).substring(7);
        idMap.set(action.id, newId);
        return { ...action, id: newId };
      });
      
      // Atualizar dependências com os novos IDs
      newElements.forEach(action => {
        if (action.dependsOn) {
          action.dependsOn = action.dependsOn.map(depId => idMap.get(depId) || depId);
        }
        if (action.nextActions) {
          action.nextActions = action.nextActions.map(nextId => idMap.get(nextId) || nextId);
        }
      });
      
      // Criar novo template
      const newTemplate: Omit<ActionTemplateSchema, 'id'> = {
        ...template,
        title: newTitle || `${template.title} (Copy)`,
        elements: newElements,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: Date.now()
      };
      
      delete (newTemplate as any).id;
      
      return await this.createActionTemplate(newTemplate);
    } catch (error) {
      console.error('Error cloning template:', error);
      throw error;
    }
  }

  // Novo método para buscar templates por categoria
  async fetchTemplatesByCategory(category: string): Promise<ActionTemplateSchema[]> {
    try {
      const q = query(
        this.templatesCollection, 
        where('category', '==', category),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ActionTemplateSchema));
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw error;
    }
  }

  // Novo método para buscar templates por tags
  async fetchTemplatesByTags(tags: string[]): Promise<ActionTemplateSchema[]> {
    try {
      // Firebase não suporta consultas OR em arrays, então precisamos fazer várias consultas
      const results: ActionTemplateSchema[] = [];
      
      for (const tag of tags) {
        const q = query(
          this.templatesCollection, 
          where('tags', 'array-contains', tag)
        );
        
        const snapshot = await getDocs(q);
        const templates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ActionTemplateSchema));
        
        // Adicionar apenas templates únicos
        templates.forEach(template => {
          if (!results.some(r => r.id === template.id)) {
            results.push(template);
          }
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching templates by tags:', error);
      throw error;
    }
  }
}

export const actionTemplateService = new ActionTemplateService()
