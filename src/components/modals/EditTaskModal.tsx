import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  X,
  AlertTriangle,
    Info, // Import Info icon
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { TaskSchema, TaskAction } from '../../types/firestore-schema'
import { systemSettingsService } from '../../services/SystemSettingsService'
import { actionTemplateService } from '../../services/ActionTemplateService';
import { deepCopy } from '../../utils/helpers';

interface EditTaskModalProps {
  task: TaskSchema
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: (task: TaskSchema) => void
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  // Basic form state
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    assignedTo: task.assignedTo,
    priority: task.priority,
    dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    difficultyLevel: task.difficultyLevel || 5,
    actions: task.actions || []  // Initialize actions
  })

  // UI state

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  // Data state
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [coinsReward, setCoinsReward] = useState(task.coinsReward || 0)
  const [templates, setTemplates] = useState<{ id: string, title: string }[]>([]); // State for templates
  const [selectedTemplate, setSelectedTemplate] = useState(''); // State for selected template

  // Reset form when task changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
        priority: task.priority,
        dueDate: new Date(task.dueDate).toISOString().split('T')[0],
        difficultyLevel: task.difficultyLevel || 5,
        actions: task.actions || [] // Ensure actions is initialized
      })
      setError(null)
      setFormErrors({})
      setSelectedTemplate('');
    }
  }, [task, isOpen])

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
        } catch (err) {
          setError('Failed to load data')
        }
      }

      loadData()
    }
  }, [isOpen, formData.difficultyLevel]) // Include formData.difficultyLevel in dependencies

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
      const updateData = {
        ...formData,
        dueDate: new Date(formData.dueDate).getTime(),
        coinsReward
      }

      await taskService.updateTask(task.id, updateData)
      onTaskUpdated({ ...task, ...updateData })
      onClose() // Close modal on success
    } catch (err: any) {
      setError(err.message || 'Failed to update task')
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
            Editar Tarefa
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
              Project
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.projectId ? 'border-red-500' : 'focus:ring-blue-500'
                }`}
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {formErrors.projectId && (
              <p className="text-red-500 text-xs mt-1">{formErrors.projectId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignees
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
              Difficulty Level (1-10)
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
              Due Date
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
    </div>
  )
}