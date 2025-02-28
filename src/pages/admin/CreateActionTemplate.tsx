// src/pages/admin/CreateActionTemplate.tsx (parte 1)

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Layout } from '../../components/Layout'
import { actionTemplateService } from '../../services/ActionTemplateService'
import { ActionTemplateSchema, TaskAction } from '../../types/firestore-schema'
import { 
  PlusCircle, Save, XCircle, Plus, Trash2, ChevronLeft, ChevronRight, 
  File, FileText, Type, List, Settings, ArrowUp, ArrowDown, FileEdit, 
  Info, Video, Mic, Link, ArrowRight, GitBranch, GitMerge, Copy
} from 'lucide-react'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { deepCopy } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

// Componente para visualizar o fluxo de trabalho
const WorkflowVisualizer: React.FC<{
  actions: TaskAction[];
  onSelectAction: (actionId: string) => void;
}> = ({ actions, onSelectAction }) => {
  // Organizar ações por dependências
  const organizeActions = () => {
    const actionMap = new Map<string, TaskAction>();
    actions.forEach(action => actionMap.set(action.id, action));
    
    // Encontrar ações iniciais (sem dependências)
    const initialActions = actions.filter(action => 
      !action.dependsOn || action.dependsOn.length === 0
    );
    
    // Organizar em níveis
    const levels: TaskAction[][] = [];
    let currentLevel = initialActions;
    
    while (currentLevel.length > 0) {
      levels.push(currentLevel);
      
      // Encontrar próximo nível (ações que dependem apenas de ações já processadas)
      const processedActionIds = new Set<string>();
      levels.flat().forEach(action => processedActionIds.add(action.id));
      
      const nextLevel = actions.filter(action => {
        if (processedActionIds.has(action.id)) return false;
        
        // Verificar se todas as dependências já foram processadas
        return action.dependsOn?.every(depId => processedActionIds.has(depId)) ?? true;
      });
      
      currentLevel = nextLevel;
    }
    
    return levels;
  };
  
  const actionLevels = organizeActions();
  
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col space-y-4 min-w-max">
        {actionLevels.map((level, levelIndex) => (
          <div key={levelIndex} className="flex space-x-4">
            {level.map(action => (
              <div 
                key={action.id}
                onClick={() => onSelectAction(action.id)}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors
                  ${action.completed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}`}
              >
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-gray-500">{action.type}</div>
                {action.dependsOn && action.dependsOn.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Depends on: {action.dependsOn.length} actions
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para editar dependências
const DependencyEditor: React.FC<{
  actions: TaskAction[];
  currentActionId: string;
  onUpdateDependencies: (actionId: string, dependsOn: string[]) => void;
}> = ({ actions, currentActionId, onUpdateDependencies }) => {
  const currentAction = actions.find(a => a.id === currentActionId);
  const [selectedDeps, setSelectedDeps] = useState<string[]>(
    currentAction?.dependsOn || []
  );
  
  // Filtrar para não mostrar a ação atual e evitar ciclos
  const availableActions = actions.filter(a => a.id !== currentActionId);
  
  const handleToggleDependency = (actionId: string) => {
    setSelectedDeps(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };
  
  const handleSave = () => {
    onUpdateDependencies(currentActionId, selectedDeps);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium mb-2">Editar Dependências</h3>
      <p className="text-sm text-gray-600 mb-4">
        Selecione as ações que devem ser concluídas antes desta ação.
      </p>
      
      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {availableActions.length === 0 ? (
          <p className="text-sm text-gray-500">Não há outras ações disponíveis.</p>
        ) : (
          availableActions.map(action => (
            <div key={action.id} className="flex items-center">
              <input
                type="checkbox"
                id={`dep-${action.id}`}
                checked={selectedDeps.includes(action.id)}
                onChange={() => handleToggleDependency(action.id)}
                className="mr-2"
              />
              <label htmlFor={`dep-${action.id}`} className="text-sm">
                {action.title} ({action.type})
              </label>
            </div>
          ))
        )}
      </div>
      
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Salvar Dependências
      </button>
    </div>
  );
};

// Componente principal
export const CreateActionTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [type, setType] = useState<ActionTemplateSchema['type']>('custom')
  const [numSteps, setNumSteps] = useState(1)
  const [currentStep, setCurrentStep] = useState(1)
  const [elementsByStep, setElementsByStep] = useState<{ [step: number]: TaskAction[] }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [templates, setTemplates] = useState<ActionTemplateSchema[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [saveOption, setSaveOption] = useState<'replace' | 'new' | null>(null);
  const [existingTemplateId, setExistingTemplateId] = useState<string | null>(null);
  
  // Novos estados para o fluxo de trabalho
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showDependencyEditor, setShowDependencyEditor] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  
  // Referência para o editor
  const editorRef = useRef<any>(null);
// src/pages/admin/CreateActionTemplate.tsx (parte 2)

  // Função para buscar templates
  const fetchTemplates = useCallback(async () => {
    try {
      const fetchedTemplates = await actionTemplateService.fetchActionTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setError("Failed to load templates.");
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Função para carregar um template existente
  useEffect(() => {
    const loadTemplate = async () => {
      if (selectedTemplate) {
        try {
          const templateData = await actionTemplateService.getActionTemplateById(selectedTemplate);
          if (templateData) {
            setTitle(templateData.title);
            setExistingTemplateId(templateData.id);
            setCategory(templateData.category || '');
            setTags(templateData.tags || []);
            setType(templateData.type || 'custom');

            // Processar elementos e dependências
            const allElements = templateData.elements || [];
            
            // Organizar elementos por passos
            const newElementsByStep: { [step: number]: TaskAction[] } = {};
            let currentStep = 1;
            let currentStepElements: TaskAction[] = [];

            // Verificar se há um fluxo de trabalho definido
            if (templateData.workflow && templateData.workflow.steps) {
              // Usar a estrutura de fluxo de trabalho para organizar os elementos
              templateData.workflow.steps.forEach((step, index) => {
                const stepActions = step.actions
                  .map(actionId => allElements.find(el => el.id === actionId))
                  .filter(Boolean) as TaskAction[];
                
                newElementsByStep[index + 1] = stepActions;
              });
              
              setNumSteps(templateData.workflow.steps.length);
            } else {
              // Método antigo: agrupar elementos sequencialmente
              for (const element of allElements) {
                currentStepElements.push(element);
                if (element.type === 'document' || element.type === 'approval') {
                  newElementsByStep[currentStep] = currentStepElements;
                  currentStep++;
                  currentStepElements = [];
                }
              }
              
              // Adicionar elementos restantes ao último passo
              if (currentStepElements.length > 0) {
                newElementsByStep[currentStep] = currentStepElements;
              }
              
              setNumSteps(Object.keys(newElementsByStep).length || 1);
            }

            setElementsByStep(newElementsByStep);
            setCurrentStep(1);
          }
        } catch (error) {
          console.error("Error loading template:", error);
          setError("Failed to load the selected template.");
        }
      } else {
        // Reset if no template is selected
        setTitle('');
        setElementsByStep({});
        setNumSteps(1);
        setCurrentStep(1);
        setExistingTemplateId(null);
        setCategory('');
        setTags([]);
        setType('custom');
      }
    };

    loadTemplate();
  }, [selectedTemplate]);

  // Função para adicionar uma nova ação
  const handleAddElement = (type: TaskAction['type']) => {
    setElementsByStep(prev => {
      const currentElements = prev[currentStep] || [];
      let newElement: TaskAction;

      // Criar elemento base
      const baseElement: Partial<TaskAction> = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        type,
        title: '',
        completed: false,
        description: '',
        priority: 'medium',
        isBlocking: false
      };

      // Adicionar campos específicos por tipo
      switch (type) {
        case 'info':
          newElement = {
            ...baseElement,
            infoTitle: '',
            infoDescription: '',
            hasAttachments: false,
            data: {}
          } as TaskAction;
          break;
        case 'video_upload':
          newElement = {
            ...baseElement,
            title: 'Upload de Vídeo',
            mediaSpecs: {
              resolution: '1920x1080',
              format: 'MP4',
              frameRate: 30
            },
            data: {
              mediaMetadata: {
                duration: 0,
                resolution: '',
                codec: '',
                bitrate: 0
              }
            }
          } as TaskAction;
          break;
        case 'video_decoupage':
          newElement = {
            ...baseElement,
            title: 'Decupagem de Vídeo',
            decoupageInstructions: '',
            timeMarkers: [],
            data: {}
          } as TaskAction;
          break;
        case 'video_editing':
          newElement = {
            ...baseElement,
            title: 'Edição de Vídeo',
            mediaSpecs: {
              resolution: '1920x1080',
              format: 'MP4',
              frameRate: 30
            },
            data: {}
          } as TaskAction;
          break;
        case 'audio_processing':
          newElement = {
            ...baseElement,
            title: 'Processamento de Áudio',
            data: {}
          } as TaskAction;
          break;
        default:
          newElement = baseElement as TaskAction;
      }

      return {
        ...prev,
        [currentStep]: [...currentElements, newElement]
      };
    });
  };

  // Função para remover uma ação
  const handleRemoveElement = (id: string) => {
    // Primeiro, verificar se alguma ação depende desta
    const allActions = Object.values(elementsByStep).flat();
    const dependentActions = allActions.filter(action => 
      action.dependsOn?.includes(id)
    );
    
    if (dependentActions.length > 0) {
      setError(`Não é possível remover esta ação porque ${dependentActions.length} outras ações dependem dela.`);
      return;
    }
    
    setElementsByStep(prev => {
      const currentElements = prev[currentStep] || [];
      const updatedElements = currentElements.filter(element => element.id !== id);
      return {
        ...prev,
        [currentStep]: updatedElements
      };
    });
    
    // Limpar seleção se a ação removida estava selecionada
    if (selectedActionId === id) {
      setSelectedActionId(null);
      setShowDependencyEditor(false);
    }
  };

  // Função para atualizar uma ação
  const handleElementChange = (id: string, field: keyof TaskAction, value: any) => {
    setElementsByStep(prev => {
      const currentElements = prev[currentStep] || [];
      const updatedElements = currentElements.map(element =>
        element.id === id ? { ...element, [field]: value } : element
      );
      return {
        ...prev,
        [currentStep]: updatedElements
      };
    });
  };

  // Função para atualizar dependências
  const handleUpdateDependencies = (actionId: string, dependsOn: string[]) => {
    // Verificar ciclos de dependência
    const allActions = Object.values(elementsByStep).flat();
    const actionMap = new Map<string, TaskAction>();
    
    // Criar mapa temporário com as novas dependências
    allActions.forEach(action => {
      if (action.id === actionId) {
        actionMap.set(action.id, { ...action, dependsOn });
      } else {
        actionMap.set(action.id, action);
      }
    });
    
    // Verificar ciclos
    try {
      checkForDependencyCycles(Array.from(actionMap.values()));
      
      // Se não houver ciclos, atualizar o estado
      setElementsByStep(prev => {
        const newElementsByStep = { ...prev };
        
        // Encontrar o passo que contém a ação
        for (const [step, elements] of Object.entries(newElementsByStep)) {
          const elementIndex = elements.findIndex(el => el.id === actionId);
          if (elementIndex >= 0) {
            newElementsByStep[parseInt(step)] = [
              ...elements.slice(0, elementIndex),
              { ...elements[elementIndex], dependsOn },
              ...elements.slice(elementIndex + 1)
            ];
            break;
          }
        }
        
        return newElementsByStep;
      });
      
      setShowDependencyEditor(false);
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar dependências: ciclo detectado');
    }
  };

  // Função para verificar ciclos de dependência
  const checkForDependencyCycles = (actions: TaskAction[]): void => {
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
              throw new Error(`Ciclo de dependência detectado envolvendo ações ${actionId} e ${depId}`);
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
  };

  // Função para adicionar uma tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Função para remover uma tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Função para atualizar o número de passos
  const handleNumStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setNumSteps(isNaN(value) || value < 1 ? 1 : value);
  };

  // Efeito para ajustar os passos quando o número muda
  useEffect(() => {
    setElementsByStep(prev => {
      const newElements = { ...prev };
      for (let i = 1; i <= numSteps; i++) {
        if (!newElements[i]) {
          newElements[i] = [];
        }
      }
      Object.keys(newElements).forEach(key => {
        const stepNum = parseInt(key, 10);
        if (stepNum > numSteps) {
          delete newElements[stepNum];
        }
      });
      return newElements;
    });

    if (currentStep > numSteps) {
      setCurrentStep(numSteps);
    }
  }, [numSteps]);

  // Função para clonar um template
  const handleCloneTemplate = async () => {
    if (!selectedTemplate) {
      setError("Selecione um template para clonar");
      return;
    }
    
    try {
      setIsLoading(true);
      const clonedTemplate = await actionTemplateService.cloneTemplate(
        selectedTemplate, 
        `${title || 'Template'} (Cópia)`
      );
      
      setSelectedTemplate(clonedTemplate.id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.message || "Erro ao clonar template");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Coletar todas as ações de todos os passos
      const allElements: TaskAction[] = [];
      for (let i = 1; i <= numSteps; i++) {
        if (elementsByStep[i]) {
          allElements.push(...elementsByStep[i]);
        }
      }
      
      // Criar estrutura de fluxo de trabalho
      const workflowSteps = [];
      for (let i = 1; i <= numSteps; i++) {
        if (elementsByStep[i] && elementsByStep[i].length > 0) {
          workflowSteps.push({
            stepId: `step-${i}`,
            actions: elementsByStep[i].map(action => action.id)
          });
        }
      }

      const newTemplate: Omit<ActionTemplateSchema, 'id'> = {
        title,
        type,
        elements: allElements,
        category,
        tags,
        order: Date.now(),
        workflow: {
          steps: workflowSteps
        }
      };

      // Verificar se estamos substituindo ou criando novo
      if (saveOption === 'replace' && existingTemplateId) {
        await actionTemplateService.updateActionTemplate(existingTemplateId, newTemplate);
        setSuccess(true);
      } else {
        // Verificar unicidade do título para novos templates
        const existingTemplates = await actionTemplateService.fetchActionTemplates();
        if (existingTemplates.some(t => t.title === title && t.id !== existingTemplateId)) {
          setError("Já existe um modelo com este título. Por favor, escolha um título diferente.");
          setIsLoading(false);
          return;
        }

        await actionTemplateService.createActionTemplate(newTemplate);
        setSuccess(true);
        
        // Resetar formulário apenas para criação
        if (saveOption === 'new' || !saveOption) {
          setTitle('');
          setElementsByStep({});
          setNumSteps(1);
          setCurrentStep(1);
          setSelectedTemplate('');
          setCategory('');
          setTags([]);
          setType('custom');
        }
      }

      await fetchTemplates(); // Atualizar lista de templates
    } catch (err: any) {
      setError(err.message || 'Falha ao criar modelo de ação');
    } finally {
      setIsLoading(false);
      setSaveOption(null);
    }
  };

  // Verificar se o formulário é válido
  const isFormValid = () => {
    if (!title.trim()) return false;
    
    // Verificar se há pelo menos uma ação em cada passo
    for (let i = 1; i <= numSteps; i++) {
      const stepElements = elementsByStep[i] || [];
      if (stepElements.length === 0) return false;
      
      // Verificar se todas as ações têm título
      for (const element of stepElements) {
        if (!element.title.trim()) return false;
      }
    }
    
    return true;
  };

  // Obter todas as ações para visualização do fluxo
  const getAllActions = () => {
    return Object.values(elementsByStep).flat();
  };
// src/pages/admin/CreateActionTemplate.tsx (parte 3 - interface)

  return (
    <Layout role="admin">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <PlusCircle className="mr-3 text-blue-600" />
            Criar Modelo de Ação
          </h1>
          <div className="flex space-x-2">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um Modelo</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleCloneTemplate}
              disabled={!selectedTemplate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
              title="Clonar Modelo Selecionado"
            >
              <Copy size={18} className="mr-1" /> Clonar
            </button>
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="Gerenciar Modelos"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Sucesso! </strong>
            <span className="block sm:inline"> Modelo de ação salvo com sucesso.</span>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título do Modelo
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Fluxo
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as ActionTemplateSchema['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="custom">Personalizado</option>
                <option value="video_production">Produção de Vídeo</option>
                <option value="content_creation">Criação de Conteúdo</option>
                <option value="design">Design</option>
                <option value="development">Desenvolvimento</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Marketing, Desenvolvimento, Design"
              />
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Adicionar tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XCircle size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="numSteps" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Etapas
            </label>
            <input
              type="number"
              id="numSteps"
              value={numSteps}
              onChange={handleNumStepsChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(currentStep / numSteps) * 100}%` }}></div>
          </div>
        </div>

        {/* Visualização do Fluxo de Trabalho */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Visualização do Fluxo de Trabalho</h2>
            <button
              onClick={() => setShowWorkflow(!showWorkflow)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
            >
              {showWorkflow ? 'Ocultar Fluxo' : 'Mostrar Fluxo'}
            </button>
          </div>
          
          {showWorkflow && (
            <div className="border rounded-lg p-4 bg-gray-50 overflow-x-auto">
              <WorkflowVisualizer 
                actions={getAllActions()} 
                onSelectAction={(actionId) => {
                  setSelectedActionId(actionId);
                  setShowDependencyEditor(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Editor de Dependências */}
        {showDependencyEditor && selectedActionId && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Editor de Dependências</h2>
              <button
                onClick={() => setShowDependencyEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <DependencyEditor
              actions={getAllActions()}
              currentActionId={selectedActionId}
              onUpdateDependencies={handleUpdateDependencies}
            />
          </div>
        )}

        {/* Etapas e Ações */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Etapa {currentStep} de {numSteps}</h2>
          
          <div className="space-y-4 mb-6">
            {(elementsByStep[currentStep] || []).map((element, index) => (
              <div key={element.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {getActionIcon(element.type)}
                    <input
                      type="text"
                      value={element.title}
                      onChange={(e) => handleElementChange(element.id, 'title', e.target.value)}
                      placeholder="Título da Ação"
                      className="ml-2 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedActionId(element.id);
                        setShowDependencyEditor(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Editar Dependências"
                    >
                      <GitBranch size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveElement(element.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Remover Ação"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <textarea
                  value={element.description || ''}
                  onChange={(e) => handleElementChange(element.id, 'description', e.target.value)}
                  placeholder="Descrição da ação"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900 mb-4"
                  rows={2}
                />
                
                {/* Campos específicos por tipo */}
                {renderTypeSpecificFields(element)}
                
                {/* Mostrar dependências */}
                {element.dependsOn && element.dependsOn.length > 0 && (
                  <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Depende de:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {element.dependsOn.map(depId => {
                        const depAction = getAllActions().find(a => a.id === depId);
                        return (
                          <span key={depId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {depAction?.title || 'Ação Desconhecida'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Adicionar Ações */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Adicionar Ação</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddElement('text')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <Type size={16} className="mr-1" /> Texto
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('long_text')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <FileText size={16} className="mr-1" /> Texto Longo
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('file_upload')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <File size={16} className="mr-1" /> Arquivo
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('document')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <FileEdit size={16} className="mr-1" /> Documento
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('info')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <Info size={16} className="mr-1" /> Informações
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('video_upload')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <Video size={16} className="mr-1" /> Upload de Vídeo
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('video_decoupage')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <GitMerge size={16} className="mr-1" /> Decupagem
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('video_editing')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <Video size={16} className="mr-1" /> Edição de Vídeo
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('audio_processing')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <Mic size={16} className="mr-1" /> Áudio
              </button>
            </div>
          </div>
        </div>

        {/* Navegação entre Etapas */}
        <div className="flex justify-between mt-6 mb-6">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" /> Anterior
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(Math.min(numSteps, currentStep + 1))}
            disabled={currentStep === numSteps}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
          >
            Próximo <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        {/* Botões de Salvar */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setSaveOption('new')}
            disabled={isLoading || !isFormValid()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            <Save size={18} className="mr-2" />
            Salvar como Novo
          </button>
          {existingTemplateId && (
            <button
              type="button"
              onClick={() => setSaveOption('replace')}
              disabled={isLoading || !isFormValid()}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center"
            >
              <Save size={18} className="mr-2" />
              Atualizar Existente
            </button>
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Salvar */}
      {saveOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirmar Ação</h3>
            <p className="mb-4">
              {saveOption === 'replace'
                ? 'Tem certeza que deseja substituir o modelo existente?'
                : 'Deseja criar um novo modelo com este título?'}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSaveOption(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 text-white rounded-lg ${
                  saveOption === 'replace' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {saveOption === 'replace' ? 'Substituir' : 'Criar Novo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Templates */}
      <ManageTemplatesModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        templates={templates}
        onDelete={handleDeleteTemplate}
        onReorder={handleReorderTemplates}
      />
    </Layout>
  );
}

export default CreateActionTemplate;
