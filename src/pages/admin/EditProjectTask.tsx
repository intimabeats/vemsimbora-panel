// src/pages/admin/EditProjectTask.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import {
  CheckCircle,
  AlertTriangle,
    Info, // Import Info icon
    File,
    Download,
    ArrowLeft // ADDED THIS IMPORT
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema, TaskAction } from '../../types/firestore-schema'
import { systemSettingsService } from '../../services/SystemSettingsService'
import { actionTemplateService } from '../../services/ActionTemplateService';
import { deepCopy } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext'

export const EditProjectTask: React.FC = () => {
    const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>() // Get both IDs
    const navigate = useNavigate()
    const {currentUser} = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: projectId || '',
        assignedTo: [] as string[],
        priority: 'medium' as TaskSchema['priority'],
        dueDate: new Date().toISOString().split('T')[0],
        difficultyLevel: 5,
        actions: [] as TaskAction[]
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

    const [users, setUsers] = useState<{ id: string, name: string }[]>([])
    const [coinsReward, setCoinsReward] = useState(0)
    const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]); // State for templates
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (projectId) {
            projectService.getProjectById(projectId)
                .then(project => setProjectName(project.name))
                .catch(err => {
                    console.error("Error fetching project name:", err);
                    setError("Failed to fetch project name.");
                });
        }
    }, [projectId]);

    // Load initial data (projects, users, settings, templates)
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [usersRes, settings, templatesRes, taskData] = await Promise.all([
                    userManagementService.fetchUsers(),
                    systemSettingsService.getSettings(),
                    actionTemplateService.fetchActionTemplates(), // Fetch templates
                    taskService.getTaskById(taskId!)
                ])

                setUsers(usersRes.data.map(u => ({ id: u.id, name: u.name })))
                setCoinsReward(Math.round(settings.taskCompletionBase * formData.difficultyLevel * settings.complexityMultiplier))
                setTemplates(templatesRes.map(t => ({ id: t.id, title: t.title }))); // Set templates

                // Set initial form data from fetched task
                if (taskData) {
                    setFormData({
                        title: taskData.title,
                        description: taskData.description,
                        projectId: taskData.projectId,
                        assignedTo: taskData.assignedTo,
                        priority: taskData.priority,
                        dueDate: new Date(taskData.dueDate).toISOString().split('T')[0],
                        difficultyLevel: taskData.difficultyLevel || 5,
                        actions: taskData.actions || []
                    });
                }

            } catch (err: any) {
                setError(err.message || 'Falha ao carregar dados');
            } finally {
                setIsLoading(false);
            }
        }

        if (taskId) {
            loadData();
        }
    }, [taskId, formData.difficultyLevel, projectId])


    // Form validation (Step 1)
    const validateForm = () => {
        const errors: { [key: string]: string } = {}
        if (!formData.title.trim()) errors.title = 'Title is required'
        if (!formData.description.trim()) errors.description = 'Description is required'
        if (!formData.projectId) errors.projectId = 'Project is required'
        if (formData.assignedTo.length === 0) errors.assignedTo = 'At least one assignee is required'
        if (!formData.dueDate) errors.dueDate = "Due date is required";

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

    const handleAddActionFromTemplate = async () => {
        if (!selectedTemplate) return;

        try {
            const fullTemplate = await actionTemplateService.getActionTemplateById(selectedTemplate);
            if (!fullTemplate) return;

            const newAction: TaskAction = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                title: fullTemplate.title, // Use template title
                type: 'document', //  We use a single type.
                completed: false,
                description: fullTemplate.elements.map(e => e.description).join(' '), // combine descriptions.
                data: { steps: deepCopy(fullTemplate.elements) }, // Store the steps in 'data'
            };

            setFormData(prev => ({
                ...prev,
                actions: [...prev.actions, newAction],
            }));
        } catch (error) {
            console.error("Error adding action from template:", error);
            setError("Failed to add action from template.");
        }
    };

    // NEW: Add an action manually
    const handleAddAction = (type: TaskAction['type']) => {
        let newAction: Partial<TaskAction> = {
            id: Date.now().toString() + Math.random().toString(36).substring(7), // Unique ID
            type: type,
            title: '', // Default title
            completed: false,
        };

        // If it's an 'info' type, add the specific fields
        if (type === 'info') {
            newAction = {
                ...newAction,
                infoTitle: '',
                infoDescription: '',
                hasAttachments: false,
                data: {} // Initialize data
            };
        }

        setFormData(prev => ({
            ...prev,
            actions: [...prev.actions, newAction as TaskAction],
        }));
    };

    // NEW: Handle changes within an action
    const handleActionChange = (actionId: string, field: keyof TaskAction, value: any) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.map(action =>
                action.id === actionId ? { ...action, [field]: value } : action
            ),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)
        setError(null)

        try {
            if (!taskId) {
                setError('Task ID is missing.');
                return
            }
            const updateData = {
                ...formData,
                dueDate: new Date(formData.dueDate).getTime(),
                coinsReward
            }

            await taskService.updateTask(taskId, updateData)
            navigate(`/admin/projects/${projectId}`); // Navigate back

        } catch (err: any) {
            setError(err.message || 'Failed to update task')
        } finally {
            setLoading(false)
        }
    }


    return (
    <Layout role={currentUser?.role || 'employee'}>
      <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-blue-600">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <CheckCircle className="mr-3 text-blue-600" />
              Editar Tarefa de {projectName}
            </h1>
            <div></div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
              <AlertTriangle className="mr-2" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
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
                  Description
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
                  Add Action from Template
                </label>
                <div className="flex space-x-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Template</option>
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
                    Add
                  </button>
                </div>
              </div>

              {/* NEW: Add Action Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar Ação Manualmente
                </label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => handleAddAction('info')}
                        className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        <Info size={16} className="mr-1" /> Informações Importantes
                    </button>
                    {/* Add other action type buttons here as needed */}
                </div>
            </div>

              {/* Display Added Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actions
                </label>
                <div className="space-y-2">
                {formData.actions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <span className="font-medium text-gray-900">{action.title}</span>
                            {/* NEW: Display infoTitle if it's an 'info' type */}
                            {action.type === 'info' && action.infoTitle && (
                                <span className="block text-sm text-gray-600">{action.infoTitle}</span>
                            )}
                        </div>
                         {/* NEW: Add input fields for 'info' type */}
                        {action.type === 'info' && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={action.infoTitle || ''}
                                    onChange={(e) => handleActionChange(action.id, 'infoTitle', e.target.value)}
                                    placeholder="Título das Informações"
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900"
                                />
                                <textarea
                                    value={action.infoDescription || ''}
                                    onChange={(e) => handleActionChange(action.id, 'infoDescription', e.target.value)}
                                    placeholder="Descrição das Informações"
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-gray-900"
                                />
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={action.hasAttachments || false}
                                        onChange={(e) => handleActionChange(action.id, 'hasAttachments', e.target.checked)}
                                        className="mr-2"
                                    />
                                    Requer arquivos?
                                </label>
                            </div>
                        )}
                    </div>
                ))}
                </div>
              </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 rounded-lg text-white transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {loading ? 'Updating...' : 'Update Task'}
                </button>
            </form>
          </div>
        </Layout>
    )
}
