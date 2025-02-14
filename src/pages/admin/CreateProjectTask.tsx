import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import {
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft // Import ArrowLeft
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema, TaskAction } from '../../types/firestore-schema'
import { systemSettingsService } from '../../services/SystemSettingsService'
import { actionTemplateService } from '../../services/ActionTemplateService';

export const CreateProjectTask: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // Basic form state (same as CreateTaskModal, but projectId is known)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '', // Directly use projectId from route params
    assignedTo: [] as string[],
    priority: 'medium' as TaskSchema['priority'],
    dueDate: new Date().toISOString().split('T')[0],
    difficultyLevel: 5,
    actions: [] as TaskAction[]
  })

  // UI state
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Data state (no need for projects, as it's fixed)
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [coinsReward, setCoinsReward] = useState(0)
  const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
    const [projectName, setProjectName] = useState('');


    useEffect(() => {
        if (projectId) {
            // Set the projectId in formData when the component mounts and projectId is available
            setFormData(prev => ({ ...prev, projectId: projectId }));

            // Fetch the project name
            projectService.getProjectById(projectId)
                .then(project => setProjectName(project.name))
                .catch(err => {
                    console.error("Error fetching project name:", err);
                    setError("Failed to fetch project name."); // Set error state
                });
        }
    }, [projectId]); // Run this effect whenever projectId changes

  // Load initial data (users, settings, templates) - NO PROJECTS
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, settings, templatesRes] = await Promise.all([
          userManagementService.fetchUsers(),
          systemSettingsService.getSettings(),
          actionTemplateService.fetchActionTemplates()
        ])

        setUsers(usersRes.data.map(u => ({ id: u.id, name: u.name })))
        setCoinsReward(Math.round(settings.taskCompletionBase * formData.difficultyLevel * settings.complexityMultiplier))
        setTemplates(templatesRes.map(t => ({ id: t.id, title: t.title })));
      } catch (err) {
        setError('Falha ao carregar dados')
      }
    }

    loadData()
  }, [formData.difficultyLevel]) // Removed isOpen

  // Form validation (Step 1) - NO PROJECT VALIDATION
  const validateStep1 = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.title.trim()) errors.title = 'Título é obrigatório'
    if (!formData.description.trim()) errors.description = 'Descrição é obrigatória'
    if (formData.assignedTo.length === 0) errors.assignedTo = 'Pelo menos um responsável é obrigatório'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form validation (Step 2) - Remains the same
  const validateStep2 = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.dueDate) errors.dueDate = 'Data de vencimento é obrigatória'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Event handlers - Remains mostly the same
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

  const handleActionChange = (index: number, field: keyof TaskAction, value: any) => {
    setFormData(prev => {
      const newActions = [...prev.actions];
      newActions[index] = { ...newActions[index], [field]: value };
      return { ...prev, actions: newActions };
    });
  };

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

      const newActions: TaskAction[] = JSON.parse(JSON.stringify(fullTemplate.elements)).map((action: TaskAction) => ({
        ...action,
        id: Date.now().toString() + Math.random().toString(36).substring(7),
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

      // Navigate to the task details page after successful creation
      navigate(`/tasks/${newTask.id}`);

    } catch (err: any) {
      setError(err.message || 'Falha ao criar tarefa')
    } finally {
      setLoading(false)
    }
  }


  return (
    <Layout role="admin">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-blue-600">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                <CheckCircle className="mr-3 text-blue-600" />
                Criar Nova Tarefa para {projectName}
            </h1>
            <div></div> {/* This empty div is important for correct spacing */}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center mb-4">
            <AlertTriangle className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
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
    </Layout>
  )
}
