import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  X,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema, TaskAction } from '../../types/firestore-schema'
import { systemSettingsService } from '../../services/SystemSettingsService'
import { actionTemplateService } from '../../services/ActionTemplateService';

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: (task: TaskSchema) => void
  projectId?: string; // Add projectId as an optional prop
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  projectId // Receive projectId
}) => {
  // Basic form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '', // Use prop, fallback to empty string
    assignedTo: [] as string[],
    priority: 'medium' as TaskSchema['priority'],
    dueDate: new Date().toISOString().split('T')[0],
    difficultyLevel: 5,
    actions: [] as TaskAction[] // Initialize actions
  })

  // UI state
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Data state
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [coinsReward, setCoinsReward] = useState(0)
  const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]); // State for templates
  const [selectedTemplate, setSelectedTemplate] = useState(''); // State for selected template
  const [selectedProjectName, setSelectedProjectName] = useState(''); // NEW: To store and display the selected project's name


  // Reset form when modal opens/closes or projectId changes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                title: '',
                description: '',
                projectId: projectId || '', // Use the prop, fallback to empty string
                assignedTo: [],
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0],
                difficultyLevel: 5,
                actions: [] // Reset actions
            });
            setStep(1);
            setError(null);
            setFormErrors({});
            setSelectedTemplate(''); // Reset selected template
            setSelectedProjectName(''); // Reset selected project name
        } else {
            // If the modal is open and projectId is provided, update the form
            setFormData(prev => ({ ...prev, projectId: projectId || '' }));
        }
    }, [isOpen, projectId]);

  // Load initial data (projects, users, settings, templates)
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [projectsRes, usersRes, settings, templatesRes] = await Promise.all([
            projectService.fetchProjects(),
            userManagementService.fetchUsers(),
            systemSettingsService.getSettings(),
            actionTemplateService.fetchActionTemplates() // Fetch templates
          ])

          setProjects(projectsRes.data.map(p => ({ id: p.id, name: p.name })))
          setUsers(usersRes.data.map(u => ({ id: u.id, name: u.name })))
          setCoinsReward(Math.round(settings.taskCompletionBase * formData.difficultyLevel * settings.complexityMultiplier))
          setTemplates(templatesRes.map(t => ({ id: t.id, title: t.title }))); // Set templates

          // NEW: If projectId is provided, find and set the project name
          if (projectId) {
            const preselectedProject = projectsRes.data.find(p => p.id === projectId);
            if (preselectedProject) {
              setSelectedProjectName(preselectedProject.name);
            }
          }
        } catch (err) {
          setError('Failed to load data')
        }
      }

      loadData()
    }
  }, [isOpen, formData.difficultyLevel, projectId]) // Add projectId to dependencies

  // Form validation (Step 1)
  const validateStep1 = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.title.trim()) errors.title = 'Título é obrigatório'
    if (!formData.description.trim()) errors.description = 'Descrição é obrigatória'
    if (!formData.projectId) errors.projectId = 'Projeto é obrigatório'
    if (formData.assignedTo.length === 0) errors.assignedTo = 'Pelo menos um responsável é obrigatório'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form validation (Step 2)
  const validateStep2 = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.dueDate) errors.dueDate = 'Data de vencimento é obrigatória'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'assignedTo'
        ? Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value)
        : value
    }))

    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

    // Handle changes within an action (title, description, etc.)
    const handleActionChange = (index: number, field: keyof TaskAction, value: any) => {
        setFormData(prev => {
            const newActions = [...prev.actions];
            newActions[index] = { ...newActions[index], [field]: value };
            return { ...prev, actions: newActions };
        });
    };

    // Handle removing an action
    const handleRemoveAction = (index: number) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index)
        }));
    };


  const handleAddActionFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const fullTemplate = await actionTemplateService.getActionTemplateById(selectedTemplate);
      if (!fullTemplate) return;

      // Deep copy and add new IDs, including description
      const newActions: TaskAction[] = JSON.parse(JSON.stringify(fullTemplate.elements)).map((action: TaskAction) => ({
        ...action,
        id: Date.now().toString() + Math.random().toString(36).substring(7), // New unique ID
        completed: false,
        completedAt: null,
      }));

      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, ...newActions],
      }));
    } catch (error) {
      console.error("Error adding action from template:", error);
      setError("Failed to add action from template.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    setError(null)

    try {
      const newTask = await taskService.createTask({
        ...formData,
        status: 'pending',
        dueDate: new Date(formData.dueDate).getTime(),
        coinsReward
      })

      onTaskCreated(newTask);
      onClose(); // Close the modal on success
    } catch (err: any) {
      setError(err.message || 'Falha ao criar tarefa')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <CheckCircle className="mr-2 text-blue-600" />
            Criar Nova Tarefa (Passo {step}/2)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
              <AlertTriangle className="mr-2" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.title ? 'border-red-500' : 'focus:ring-blue-500'
                    }`}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 h-24 ${formErrors.description ? 'border-red-500' : 'focus:ring-blue-500'
                    }`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projeto
                </label>
                <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.projectId ? 'border-red-500' : 'focus:ring-blue-500'}`}
                    disabled={!!projectId} // Disable if projectId is provided
                >
                    {projectId ? (
                        <option value={formData.projectId}>{selectedProjectName || 'Carregando...'}</option>
                    ) : (
                        <>
                            <option value="">Selecione o Projeto</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </>
                    )}
                </select>
                {formErrors.projectId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.projectId}</p>
                )}
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsáveis
                </label>
                <select
                  multiple
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 h-24 ${formErrors.assignedTo ? 'border-red-500' : 'focus:ring-blue-500'
                    }`}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {formErrors.assignedTo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.assignedTo}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2)
                  }
                }}
                className="w-full py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Próximo
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Dificuldade (1-10)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, difficultyLevel: level }))}
                      className={`px-3 py-1 rounded-full text-sm ${formData.difficultyLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.dueDate ? 'border-red-500' : 'focus:ring-blue-500'
                    }`}
                />
                {formErrors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.dueDate}</p>
                )}
              </div>

              {/* Action Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adicionar Ação de um Modelo
                </label>
                <div className="flex space-x-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um Modelo</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddActionFromTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    disabled={!selectedTemplate}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Display Added Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ações
                </label>
                <div className="space-y-2">
                  {formData.actions.map((action, index) => (
                    <div key={action.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                        {/* Action Title */}
                        <input
                          type="text"
                          value={action.title}
                          onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                          placeholder={`Insira o título de ${action.type}`}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 mb-2"
                        />
                        {/* Action Description */}
                        <textarea
                          value={action.description || ''}  // Use the description here
                          onChange={(e) => handleActionChange(index, 'description', e.target.value)}
                          placeholder="Insira a descrição da ação"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 rounded-lg text-white transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {loading ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
