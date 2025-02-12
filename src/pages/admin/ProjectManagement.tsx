import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProjectSchema } from '../../types/firestore-schema'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { CreateProjectModal } from '../../components/modals/CreateProjectModal'
import { EditProjectModal } from '../../components/modals/EditProjectModal'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal'

// Named export
export const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<ProjectSchema[]>([])
  const [isLoading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    status?: ProjectSchema['status']
  }>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectSchema | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [filter, currentPage])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const fetchedProjects = await projectService.fetchProjects({
        status: filter.status,
        limit: itemsPerPage,
        page: currentPage
      })

      setProjects(fetchedProjects.data)
      setTotalPages(fetchedProjects.totalPages)
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    try {
      await projectService.deleteProject(selectedProject.id)

      // Atualizar lista de projetos
      setProjects(prevProjects =>
        prevProjects.filter(project => project.id !== selectedProject.id)
      )

      // Resetar seleção e fechar modal
      setSelectedProject(null)
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
    }
  }

  const handleEditProject = (project: ProjectSchema) => {
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  const handleDeleteConfirmation = (project: ProjectSchema) => {
    setSelectedProject(project)
    setIsDeleteModalOpen(true)
  }

  const handleProjectCreated = (newProject: ProjectSchema) => {
    setProjects(prevProjects => [newProject, ...prevProjects])
  }

  const handleProjectUpdated = (updatedProject: ProjectSchema) => {
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === updatedProject.id ? updatedProject : project
      )
    )
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const StatusBadge: React.FC<{ status: ProjectSchema['status'] }> = ({ status }) => {
    const statusStyles = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      planning: 'Planejamento',
      active: 'Ativo',
      completed: 'Concluído',
      paused: 'Pausado',
      cancelled: 'Cancelado'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }

  return (
    <Layout role="admin" isLoading={isLoading}>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <Briefcase className="mr-4 text-blue-600" /> Gerenciamento de Projetos
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
            >
              <Plus className="mr-2" /> Adicionar Projeto
            </button>
          </div>

          {/* Filtros */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>

            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({
                status: e.target.value as ProjectSchema['status']
              })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos os Status</option>
              <option value="planning">Planejamento</option>
              <option value="active">Ativos</option>
              <option value="completed">Concluídos</option>
              <option value="paused">Pausados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

          {/* Tabela de Projetos */}
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Nenhum projeto encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 truncate max-w-xs">{project.description}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Início: {new Date(project.startDate).toLocaleDateString()}
                        {project.endDate && (
                          <>
                            <br />
                            Fim: {new Date(project.endDate).toLocaleDateString()}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirmation(project)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
              >
                <ChevronLeft className="mr-2" /> Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
              >
                Próximo <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>

          {/* Modais */}
          <CreateProjectModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onProjectCreated={handleProjectCreated}
          />

          {selectedProject && (
            <>
              <EditProjectModal
                project={selectedProject}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onProjectUpdated={handleProjectUpdated}
              />

              <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProject}
                itemName={selectedProject.name}
                warningMessage="A exclusão de um projeto removerá permanentemente todas as suas informações do sistema."
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

// Default export for compatibility
export default ProjectManagement
