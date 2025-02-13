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
import { actionTemplateService } from '../../services/ActionTemplateService'; // Import

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
  const [step, setStep] = useState(1)
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
      setStep(1)
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
  const validateStep1 = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.projectId) errors.projectId = 'Project is required'
    if (formData.assignedTo.length === 0) errors.assignedTo = 'At least one assignee is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form validation (Step 2)
  const validateStep2 = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.dueDate) errors.dueDate = 'Due date is required'

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

    // Handle changes within an action (title, data, etc.)
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

      // Deep copy and add new IDs
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
            Edit Task (Step {step}/2)
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

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2)
                  }
                }}
                className="w-full py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Next
              </button>
            </>
          ) : (
            <>
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

              {/* Display Added Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actions
                </label>
                <div className="space-y-2">
                  {formData.actions.map((action, index) => (
                    <div key={action.id} className="border rounded-lg p-2 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-500">{action.type}</p>
                        {/* You can add more UI here to display/edit action details based on type */}
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
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 rounded-lg text-white transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {loading ? 'Updating...' : 'Update Task'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}