import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { 
  CheckCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'
import { TaskSchema } from '../../types/firestore-schema'
import { taskService } from '../../services/TaskService'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService'
import { CreateTaskModal } from '../../components/modals/CreateTaskModal'
import { EditTaskModal } from '../../components/modals/EditTaskModal'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal'

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<TaskSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    projectId?: string
    status?: TaskSchema['status']
  }>({})
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Opções de filtro
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskSchema | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [filter, currentPage])

  const fetchProjects = async () => {
    try {
      const fetchedProjects = await projectService.fetchProjects()
      setProjects(fetchedProjects.data.map(p => ({ id: p.id, name: p.name })))
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const fetchedTasks = await taskService.fetchTasks({
        projectId: filter.projectId,
        status: filter.status,
        limit: itemsPerPage,
        page: currentPage
      })
      
      setTasks(fetchedTasks.data)
      setTotalPages(fetchedTasks.totalPages)
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    try {
      await taskService.deleteTask(selectedTask.id)
      
      // Atualizar lista de tarefas
      setTasks(prevTasks => 
        prevTasks.filter(task => task.id !== selectedTask.id)
      )
      
      // Resetar seleção e fechar modal
      setSelectedTask(null)
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
    }
  }

  const handleEditTask = (task: TaskSchema) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  const handleDeleteConfirmation = (task: TaskSchema) => {
    setSelectedTask(task)
    setIsDeleteModalOpen(true)
  }

  const handleTaskCreated = (newTask: TaskSchema) => {
    setTasks(prevTasks => [newTask, ...prevTasks])
  }

  const handleTaskUpdated = (updatedTask: TaskSchema) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    )
  }

  const StatusBadge: React.FC<{ status: TaskSchema['status'] }> = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_approval: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      waiting_approval: 'Aguardando Aprovação',
      completed: 'Concluída',
      blocked: 'Bloqueada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }

  const PriorityBadge: React.FC<{ priority: TaskSchema['priority'] }> = ({ priority }) => {
    const priorityStyles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }

    const priorityLabels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${priorityStyles[priority]}`}>
        {priorityLabels[priority]}
      </span>
    )
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <CheckCircle className="mr-4 text-blue-600" /> Gerenciamento de Tarefas
          </h1>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
          >
            <Plus className="mr-2" /> Adicionar Tarefa
          </button>
        </div>

        {/* Filtros */}
        <div className="flex space-x-4 mb-6">
          <select 
            value={filter.projectId || ''}
            onChange={(e) => setFilter({
              ...filter,
              projectId: e.target.value || undefined
            })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todos os Projetos</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select 
            value={filter.status || ''}
            onChange={(e) => setFilter({
              ...filter,
              status: e.target.value as TaskSchema['status']
            })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="waiting_approval">Aguardando Aprovação</option>
            <option value="completed">Concluída</option>
            <option value="blocked">Bloqueada</option>
          </select>
        </div>

        {/* Tabela de Tarefas */}
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prazo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Carregando tarefas...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Nenhuma tarefa encontrada
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.projectId}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteConfirmation(task)}
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
        <CreateTaskModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={handleTaskCreated}
        />

        {selectedTask && (
          <>
            <EditTaskModal 
              task={selectedTask}
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onTaskUpdated={handleTaskUpdated}
            />

            <DeleteConfirmationModal 
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={handleDeleteTask}
              itemName={selectedTask.title}
              warningMessage="A exclusão de uma tarefa removerá permanentemente todas as suas informações do sistema."
            />
          </>
        )}
      </div>
    </Layout>
  )
}
