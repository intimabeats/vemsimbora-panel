// src/services/TaskService.ts
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
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore'
import { auth } from '../config/firebase'
import { TaskSchema, ProjectSchema, TaskAction } from '../types/firestore-schema' // Import ProjectSchema
import { systemSettingsService } from './SystemSettingsService'
import { storage } from '../config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { notificationService } from './NotificationService' // Import NotificationService
import { projectService } from './ProjectService'
import { userManagementService } from './UserManagementService'
import { activityService } from './ActivityService'; // Import ActivityService
import { rewardService } from './RewardService'; // Import RewardService

export class TaskService {
  private db = getFirestore()

  // Criar nova tarefa
  async createTask(taskData: Omit<TaskSchema, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const taskRef = doc(collection(this.db, 'tasks'))
      const settings = await systemSettingsService.getSettings()

      const coinsReward = Math.round(
        taskData.difficultyLevel *
        settings.taskCompletionBase *
        settings.complexityMultiplier
      )

      // Validate action dependencies if present
      if (taskData.actions && taskData.actions.length > 0) {
        this.validateActionDependencies(taskData.actions);
      }

      const newTask: TaskSchema = {
        id: taskRef.id,
        ...taskData,
        createdBy: auth.currentUser?.uid || '',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coinsReward,
        subtasks: taskData.subtasks || [],
        comments: taskData.comments || [],
        attachments: taskData.attachments || [],
        actions: taskData.actions || [] // Initialize actions
      }

      await setDoc(taskRef, newTask)

      // Log activity
      const projectData = await projectService.getProjectById(newTask.projectId); // Fetch project data
      await activityService.logActivity({
        userId: auth.currentUser?.uid || '',
        userName: auth.currentUser?.displayName || 'Unknown User',
        type: 'task_created',
        projectId: newTask.projectId,
        projectName: projectData.name, // Use project name
        taskId: newTask.id,
        taskName: newTask.title, // Use task name
      });

      // Create notification for assigned user
      if (newTask.assignedTo) {
        await notificationService.createNotification(
          newTask.assignedTo,
          {
            type: 'task_assigned',
            title: 'Nova Tarefa Atribuída',
            message: `Você foi atribuído à tarefa "${newTask.title}" no projeto "${projectData.name}"`,
            relatedEntityId: newTask.id
          }
        );
      }

      // Notify project managers
      if (projectData && projectData.managers) {
        for (const managerId of projectData.managers) {
          if (managerId !== auth.currentUser?.uid) { // Don't notify the creator if they're a manager
            await notificationService.createNotification(
              managerId,
              {
                type: 'task_created',
                title: 'Nova Tarefa Criada',
                message: `Uma nova tarefa "${newTask.title}" foi criada no projeto "${projectData.name}"`,
                relatedEntityId: newTask.id
              }
            );
          }
        }
      }

      return newTask
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }
  }

  // Validate action dependencies to prevent cycles and ensure all referenced actions exist
  private validateActionDependencies(actions: TaskAction[]): void {
    const actionIds = new Set(actions.map(action => action.id));
    
    // Check if all dependencies exist
    for (const action of actions) {
      if (action.dependsOn) {
        for (const depId of action.dependsOn) {
          if (!actionIds.has(depId)) {
            throw new Error(`Action ${action.id} depends on non-existent action ${depId}`);
          }
        }
      }
    }
    
    // Check for dependency cycles
    this.checkForDependencyCycles(actions);
  }

  // Check for cycles in the dependency graph
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
        if (action?.dependsOn) {
          for (const depId of action.dependsOn) {
            if (!visited.has(depId) && checkCycle(depId)) {
              return true;
            } else if (recursionStack.has(depId)) {
              throw new Error(`Dependency cycle detected involving actions ${actionId} and ${depId}`);
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

  // Atualizar tarefa
  async updateTask(taskId: string, updates: Partial<TaskSchema>) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef); // Get *previous* task data

      if (!taskSnap.exists()) {
        throw new Error("Task not found");
      }
      const previousTaskData = taskSnap.data() as TaskSchema;

      const settings = await systemSettingsService.getSettings()

      // Recalculate coins reward if difficulty changes
      const coinsReward = updates.difficultyLevel
        ? Math.round(
          updates.difficultyLevel *
          settings.taskCompletionBase *
          settings.complexityMultiplier
        )
        : undefined

      // Validate action dependencies if actions are being updated
      if (updates.actions) {
        this.validateActionDependencies(updates.actions);
      }

      const updateData = {
        ...updates,
        ...(coinsReward ? { coinsReward } : {}),
        updatedAt: Date.now()
      }

      await updateDoc(taskRef, updateData)

      // Fetch updated task
      const updatedDoc = await getDoc(taskRef)
      const updatedTaskData = { id: updatedDoc.id, ...updatedDoc.data() } as TaskSchema;

      // *** NOTIFICATION LOGIC ***
      // Check if assignee has changed
      if (updates.assignedTo && updates.assignedTo !== previousTaskData.assignedTo) {
        const projectData = await projectService.getProjectById(updatedTaskData.projectId);
        
        // Notify new assignee
        await notificationService.createNotification(
          updates.assignedTo,
          {
            type: 'task_assigned',
            title: 'Tarefa Atribuída',
            message: `Você foi atribuído à tarefa "${updatedTaskData.title}" no projeto "${projectData.name}"`,
            relatedEntityId: taskId
          }
        );
      }

      // Check if status has changed
      if (previousTaskData.status !== updatedTaskData.status) {
        // Status changed!
        const projectData = await projectService.getProjectById(updatedTaskData.projectId);

        // Create notification for assigned users
        if (updatedTaskData.assignedTo) {
          await notificationService.createNotification(
            updatedTaskData.assignedTo,
            {
              type: 'task_updated',
              title: 'Status da Tarefa Atualizado',
              message: `A tarefa "${updatedTaskData.title}" no projeto "${projectData.name}" foi atualizada para ${this.getStatusLabel(updatedTaskData.status)}`,
              relatedEntityId: taskId
            }
          );
        }
        
        // Notify project managers
        if (projectData && projectData.managers) {
          for (const managerId of projectData.managers) {
            if (managerId !== auth.currentUser?.uid) { // Don't notify the updater if they're a manager
              await notificationService.createNotification(
                managerId,
                {
                  type: 'task_updated',
                  title: 'Status da Tarefa Atualizado',
                  message: `A tarefa "${updatedTaskData.title}" no projeto "${projectData.name}" foi atualizada para ${this.getStatusLabel(updatedTaskData.status)}`,
                  relatedEntityId: taskId
                }
              );
            }
          }
        }

        // If task is completed, create reward
        if (updatedTaskData.status === 'completed' && previousTaskData.status !== 'completed') {
          if (updatedTaskData.assignedTo) {
            try {
              await rewardService.createTaskCompletionReward(
                updatedTaskData.assignedTo,
                taskId,
                updatedTaskData.projectId,
                updatedTaskData.coinsReward
              );
            } catch (rewardError) {
              console.error('Error creating reward:', rewardError);
              // Don't throw here, as we don't want to prevent task completion
            }
          }
        }
        
        // Log activity for task status update
        await activityService.logActivity({
          userId: auth.currentUser?.uid || '',
          userName: auth.currentUser?.displayName || 'Unknown User',
          type: 'task_status_update',
          projectId: updatedTaskData.projectId,
          projectName: projectData.name,
          taskId: taskId,
          taskName: updatedTaskData.title,
          newStatus: updatedTaskData.status, // Log the new status
          details: `Task status changed from ${previousTaskData.status} to ${updatedTaskData.status}`,
        });
      } else {
        // Log activity for general task update (if not a status change)
        const projectData = await projectService.getProjectById(updatedTaskData.projectId);
        await activityService.logActivity({
          userId: auth.currentUser?.uid || '',
          userName: auth.currentUser?.displayName || 'Unknown User',
          type: 'task_updated',
          projectId: updatedTaskData.projectId,
          projectName: projectData.name,
          taskId: taskId,
          taskName: updatedTaskData.title,
          details: `Task updated.`, // You can add more details here if needed
        });
      }

      return updatedTaskData;
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }
  }

  // Helper to get human-readable status labels
  private getStatusLabel(status: TaskSchema['status']): string {
    const statusLabels: Record<TaskSchema['status'], string> = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'waiting_approval': 'Aguardando Aprovação',
      'completed': 'Concluída',
      'blocked': 'Bloqueada'
    };
    return statusLabels[status] || status;
  }

  // Excluir tarefa
  async deleteTask(taskId: string) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      
      // Get task data before deletion for notifications
      const taskSnap = await getDoc(taskRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as TaskSchema;
        const projectData = await projectService.getProjectById(taskData.projectId);
        
        // Notify assigned user
        if (taskData.assignedTo) {
          await notificationService.createNotification(
            taskData.assignedTo,
            {
              type: 'task_updated',
              title: 'Tarefa Removida',
              message: `A tarefa "${taskData.title}" no projeto "${projectData.name}" foi removida`,
              relatedEntityId: null // No related entity since it's being deleted
            }
          );
        }
        
        // Log activity
        await activityService.logActivity({
          userId: auth.currentUser?.uid || '',
          userName: auth.currentUser?.displayName || 'Unknown User',
          type: 'other',
          projectId: taskData.projectId,
          projectName: projectData.name,
          taskName: taskData.title,
          details: `Task "${taskData.title}" was deleted`,
        });
      }
      
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      throw error
    }
  }

  // Buscar tarefas com paginação e filtros
  async fetchTasks(options?: {
    projectId?: string
    status?: TaskSchema['status']
    assignedTo?: string
    limit?: number
    page?: number
  }) {
    try {
      let q = query(collection(this.db, 'tasks'))

      // Filtros
      if (options?.projectId) {
        q = query(q, where('projectId', '==', options.projectId))
      }

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options?.assignedTo) {
        q = query(q, where('assignedTo', '==', options.assignedTo))
      }

      // Ordenação
      q = query(q, orderBy('createdAt', 'desc'))

      // Executar consulta
      const snapshot = await getDocs(q)
      const allTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaskSchema))

      // Paginação
      const limit = options?.limit || 10
      const page = options?.page || 1
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedTasks = allTasks.slice(startIndex, endIndex)
      const totalPages = Math.ceil(allTasks.length / limit)

      return {
        data: paginatedTasks,
        totalPages,
        totalTasks: allTasks.length
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw error
    }
  }

  // Buscar tarefa por ID
  async getTaskById(taskId: string): Promise<TaskSchema> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (taskSnap.exists()) {
        return {
          id: taskSnap.id,
          ...taskSnap.data()
        } as TaskSchema
      } else {
        throw new Error('Tarefa não encontrada')
      }
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      throw error
    }
  }

  // Upload de anexos para tarefa
  async uploadTaskAttachment(taskId: string, file: File): Promise<string> {
    try {
      // Create a unique filename to avoid collisions
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `tasks/${taskId}/attachments/${uniqueFilename}`);
      
      // Upload the file
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('File uploaded successfully:', uploadResult);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL obtained:', downloadURL);

      // Update task with new attachment
      const taskRef = doc(this.db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as TaskSchema;
        const attachments = taskData.attachments || [];
        
        // Add the new attachment URL to the array
        await updateDoc(taskRef, {
          attachments: [...attachments, downloadURL],
          updatedAt: Date.now()
        });
      }

      return downloadURL;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  }

  // Buscar anexos de uma tarefa
  async getTaskAttachments(taskId: string): Promise<string[]> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as TaskSchema
        return taskData.attachments || []
      }

      return []
    } catch (error) {
      console.error('Erro ao buscar anexos:', error)
      throw error
    }
  }

  // Adicionar comentário à tarefa
  async addTaskComment(
    taskId: string,
    comment: {
      userId: string,
      text: string,
      attachments?: string[]
    }
  ) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskDoc = await getDoc(taskRef)

      if (!taskDoc.exists()) {
        throw new Error('Tarefa não encontrada')
      }

      const taskData = taskDoc.data() as TaskSchema
      const newComment = {
        id: Date.now().toString(),
        userId: comment.userId,
        text: comment.text,
        createdAt: Date.now(),
        attachments: comment.attachments || []
      }

      await updateDoc(taskRef, {
        comments: [...(taskData.comments || []), newComment],
        updatedAt: Date.now()
      })

      // Notify task assignee about the comment if they're not the commenter
      if (taskData.assignedTo && taskData.assignedTo !== comment.userId) {
        const projectData = await projectService.getProjectById(taskData.projectId);
        await notificationService.createNotification(
          taskData.assignedTo,
          {
            type: 'task_updated',
            title: 'Novo Comentário',
            message: `Um novo comentário foi adicionado à tarefa "${taskData.title}" no projeto "${projectData.name}"`,
            relatedEntityId: taskId
          }
        );
      }

      return newComment
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      throw error
    }
  }

  // Complete a task action
  async completeTaskAction(taskId: string, actionId: string, data?: any): Promise<void> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        throw new Error('Task not found');
      }

      const taskData = taskSnap.data() as TaskSchema;
      
      // Find the action to complete
      const actionToComplete = taskData.actions.find(action => action.id === actionId);
      if (!actionToComplete) {
        throw new Error('Action not found in task');
      }
      
      // Check if all dependencies are completed before allowing completion
      if (actionToComplete.dependsOn && actionToComplete.dependsOn.length > 0) {
        const dependenciesCompleted = actionToComplete.dependsOn.every(depId => {
          const dependency = taskData.actions.find(a => a.id === depId);
          return dependency && dependency.completed;
        });
        
        if (!dependenciesCompleted) {
          throw new Error('Cannot complete this action until all dependencies are completed');
        }
      }
      
      // Update the action
      const updatedActions = taskData.actions.map(action => {
        if (action.id === actionId) {
          let updatedAction: TaskAction = {
            ...action,
            completed: true,
            completedAt: Date.now(),
            completedBy: auth.currentUser?.uid
          };

          // If it's an 'info' action with attachments, handle them
          if (action.type === 'info' && action.hasAttachments && data && data.attachments) {
            updatedAction = {
              ...updatedAction,
              data: {
                ...updatedAction.data,
                fileURLs: data.attachments // Store attachment URLs
              }
            };
          } else if (action.type === 'document' && data) {
            // For document type, store the content in the data field
            updatedAction = {
              ...updatedAction,
              data: {
                ...updatedAction.data,
                steps: updatedAction.data?.steps || [],
                fileURLs: updatedAction.data?.fileURLs || []
              }
            };
          }
          
          return updatedAction;
        }
        return action;
      });

      // Update task with completed action
      await updateDoc(taskRef, {
        actions: updatedActions,
        updatedAt: Date.now()
      });
      
      // Check if all actions are completed and update task status if needed
      const allActionsCompleted = updatedActions.every(action => action.completed);
      if (allActionsCompleted && taskData.status === 'in_progress') {
        await this.updateTask(taskId, { status: 'waiting_approval' });
      }
      
      // Find actions that depend on the completed action and notify their assignees
      const dependentActions = updatedActions.filter(action => 
        action.dependsOn?.includes(actionId) && !action.completed
      );
      
      if (dependentActions.length > 0) {
        const projectData = await projectService.getProjectById(taskData.projectId);
        
        // Notify task assignee that dependent actions are now available
        if (taskData.assignedTo) {
          await notificationService.createNotification(
            taskData.assignedTo,
            {
              type: 'task_updated',
              title: 'Novas Ações Disponíveis',
              message: `${dependentActions.length} nova(s) ação(ões) está(ão) disponível(is) na tarefa "${taskData.title}" no projeto "${projectData.name}"`,
              relatedEntityId: taskId
            }
          );
        }
      }
      
      console.log('Task action completed successfully');
    } catch (error) {
      console.error('Error completing task action:', error);
      throw error;
    }
  }

  // Uncomplete a task action
  async uncompleteTaskAction(taskId: string, actionId: string): Promise<void> {
    try {
      const taskRef = doc(this.db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) {
        throw new Error('Task not found');
      }

      const taskData = taskSnap.data() as TaskSchema;
      
      // Check if any dependent actions are already completed
      const actionToUncomplete = taskData.actions.find(action => action.id === actionId);
      if (!actionToUncomplete) {
        throw new Error('Action not found in task');
      }
      
      // Find actions that depend on this action
      const dependentActions = taskData.actions.filter(action => 
        action.dependsOn?.includes(actionId) && action.completed
      );
      
      // If there are completed dependent actions, we can't uncomplete this action
      if (dependentActions.length > 0) {
        throw new Error('Cannot uncomplete this action because other completed actions depend on it');
      }
      
      // Update the action
      const updatedActions = taskData.actions.map(action =>
        action.id === actionId ? 
          { 
            ...action, 
            completed: false, 
            completedAt: null, 
            completedBy: null, 
            attachments: action.type === 'info' && action.hasAttachments ? [] : action.attachments 
          } : 
          action
      );

      // Update task with uncompleted action
      await updateDoc(taskRef, {
        actions: updatedActions,
        updatedAt: Date.now()
      });
      
      // If task was in waiting_approval status, revert to in_progress
      if (taskData.status === 'waiting_approval') {
        await this.updateTask(taskId, { status: 'in_progress' });
      }
    } catch (error) {
      console.error('Error uncompleting task action:', error);
      throw error;
    }
  }

  // Get next available actions based on dependencies
  async getAvailableActions(taskId: string): Promise<TaskAction[]> {
    try {
      const taskData = await this.getTaskById(taskId);
      
      // An action is available if:
      // 1. It's not completed yet
      // 2. It has no dependencies, OR all its dependencies are completed
      return taskData.actions.filter(action => {
        if (action.completed) return false;
        
        // If no dependencies, it's available
        if (!action.dependsOn || action.dependsOn.length === 0) return true;
        
        // Check if all dependencies are completed
        return action.dependsOn.every(depId => {
          const dependency = taskData.actions.find(a => a.id === depId);
          return dependency && dependency.completed;
        });
      });
    } catch (error) {
      console.error('Error getting available actions:', error);
      throw error;
    }
  }

  // Batch update multiple tasks
  async batchUpdateTasks(updates: { taskId: string, data: Partial<TaskSchema> }[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);
      
      for (const update of updates) {
        const taskRef = doc(this.db, 'tasks', update.taskId);
        batch.update(taskRef, {
          ...update.data,
          updatedAt: Date.now()
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch updating tasks:', error);
      throw error;
    }
  }

  // Get task workflow statistics
  async getTaskWorkflowStats(taskId: string): Promise<{
    totalActions: number;
    completedActions: number;
    progress: number;
    nextActions: TaskAction[];
    blockedActions: TaskAction[];
  }> {
    try {
      const taskData = await this.getTaskById(taskId);
      const totalActions = taskData.actions.length;
      const completedActions = taskData.actions.filter(action => action.completed).length;
      const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
      
      // Get next available actions
      const nextActions = await this.getAvailableActions(taskId);
      
      // Get blocked actions (actions with incomplete dependencies)
      const blockedActions = taskData.actions.filter(action => {
        if (action.completed) return false;
        if (!action.dependsOn || action.dependsOn.length === 0) return false;
        
        return !action.dependsOn.every(depId => {
          const dependency = taskData.actions.find(a => a.id === depId);
          return dependency && dependency.completed;
        });
      });
      
      return {
        totalActions,
        completedActions,
        progress,
        nextActions,
        blockedActions
      };
    } catch (error) {
      console.error('Error getting task workflow stats:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService()
