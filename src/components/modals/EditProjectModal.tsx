import React, { useState, useEffect } from 'react'
import { 
  Briefcase, 
  X, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react'
import { projectService } from '../../services/ProjectService'
import { ProjectSchema } from '../../types/firestore-schema'
import { userManagementService } from '../../services/UserManagementService'

interface EditProjectModalProps {
  project: ProjectSchema
  isOpen: boolean
  onClose: () => void
  onProjectUpdated: (project: ProjectSchema) => void
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  project, 
  isOpen, 
  onClose, 
  onProjectUpdated 
}) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    startDate: new Date(project.startDate).toISOString().split('T')[0],
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    status: project.status,
    managers: project.managers
  })
  const [managers, setManagers] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar gestores
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const fetchedManagers = await userManagementService.fetchUsers({
          role: 'manager'
        })
        setManagers(fetchedManagers.data.map(user => ({
          id: user.id,
          name: user.name
        })))
      } catch (err) {
        console.error('Erro ao buscar gestores:', err)
      }
    }
    
    if (isOpen) {
      fetchManagers()
    }
  }, [isOpen])

  // Resetar estado quando o projeto mudar
  useEffect(() => {
    setFormData({
      name: project.name,
      description: project.description,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      status: project.status,
      managers: project.managers
    })
    setError(null)
  }, [project])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Preparar dados para atualização
      const updateData: Partial<ProjectSchema> = {
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate).getTime(),
        endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
        status: formData.status,
        managers: formData.managers
      }

      // Atualizar projeto
      await projectService.updateProject(project.id, updateData)

      // Chamar callback com projeto atualizado
      onProjectUpdated({
        ...project,
        ...updateData
      })

      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar projeto')
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
            <Briefcase className="mr-2 text-blue-600" />
            Editar Projeto
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
              Nome do Projeto
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Término (opcional)
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planning">Planejamento</option>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gestores
            </label>
            <select
              multiple
              name="managers"
              value={formData.managers}
              onChange={(e) => {
                const selectedManagers = Array.from(e.target.selectedOptions, option => option.value)
                setFormData(prev => ({
                  ...prev,
                  managers: selectedManagers
                }))
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            >
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white transition 
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? 'Atualizando...' : 'Atualizar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
