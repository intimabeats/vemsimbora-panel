import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  Search,
  Filter,
  Calendar,
  BarChart2,
  CheckCircle
} from 'lucide-react'
import { taskService } from '../../services/TaskService'
import { TaskSchema } from '../../types/firestore-schema'
import { projectService } from '../../services/ProjectService'
import { userManagementService } from '../../services/UserManagementService' // Add this import
import { CreateTaskModal } from '../../components/modals/CreateTaskModal'
import { EditTaskModal } from '../../components/modals/EditTaskModal'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal'

export const TaskManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskSchema[]>([])
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])
  const [users, setUsers] = useState<{[key: string]: string}>({}) // Map to store user names
  const [selectedTask, setSelectedTask] = useState<TaskSchema | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [projectsRes, tasksRes, usersRes] = await Promise.all([
          projectService.fetchProjects(),
          taskService.fetchTasks({
            projectId: projectFilter || undefined,
            status: statusFilter as TaskSchema['status'] || undefined
          }),
          userManagementService.fetchUsers() // Fetch all users
        ])

        setProjects(projectsRes.data.map(p => ({ id: p.id, name: p.name })))
        setTasks(tasksRes.data)

        // Create a map of user IDs to names
        const userMap = usersRes.data.reduce((acc, user) => {
          acc[user.id] = user.name
          return acc
        }, {} as {[key: string]: string})
        setUsers(userMap)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [projectFilter, statusFilter])

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
    const getUserNames = (userIds: string[]) => {
    return userIds
      .map(id => users[id] || id) // Use name if available, fallback to ID
      .join(', ')
  }

  const StatusBadge: React.FC<{ status: TaskSchema['status'] }> = ({ status }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_approval: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800'
    }

    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      waiting_approval: 'Aguardando Aprovação',
      completed: 'Concluída',
      blocked: 'Bloqueada'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <Layout role="admin" isLoading={isLoading}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Gerenciamento de Tarefas
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie e acompanhe todas as tarefas do sistema
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center justify-center hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="mr-2" size={20} />
              Nova Tarefa
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart2 className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total de Tarefas</p>
                  <p className="text-xl font-semibold">{tasks.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Concluídas</p>
                  <p className="text-xl font-semibold">
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="text-yellow-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Em Progresso</p>
                  <p className="text-xl font-semibold">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="text-purple-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Pendentes</p>
                  <p className="text-xl font-semibold">
                    {tasks.filter(t => t.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tarefas..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">Todos os Projetos</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting_approval">Aguardando Aprovação</option>
                <option value="completed">Concluída</option>
                <option value="blocked">Bloqueada</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {task.title}
                  </h2>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setShowEditModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setShowDeleteModal(true)
                      }}
                      className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex flex-col space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
    <Users className="mr-2" size={16} />
    <span className="truncate">
      {getUserNames(task.assignedTo)}
    </span>
  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-2" size={16} />
                    <span>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <StatusBadge status={task.status} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma tarefa encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou criar uma nova tarefa.
            </p>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateTaskModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onTaskCreated={(newTask) => {
              setTasks(prev => [newTask, ...prev])
              setShowCreateModal(false)
            }}
          />
        )}

        {selectedTask && showEditModal && (
          <EditTaskModal
            task={selectedTask}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedTask(null)
            }}
            onTaskUpdated={(updatedTask) => {
              setTasks(prev => 
                prev.map(task => 
                  task.id === updatedTask.id ? updatedTask : task
                )
              )
              setShowEditModal(false)
              setSelectedTask(null)
            }}
          />
        )}

        {selectedTask && showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedTask(null)
            }}
            onConfirm={async () => {
              try {
                await taskService.deleteTask(selectedTask.id)
                setTasks(prev => 
                  prev.filter(task => task.id !== selectedTask.id)
                )
                setShowDeleteModal(false)
                setSelectedTask(null)
              } catch (err: any) {
                setError(err.message || 'Failed to delete task')
              }
            }}
            itemName={selectedTask.title}
            warningMessage="A exclusão de uma tarefa removerá permanentemente todas as suas informações do sistema."
          />
        )}
      </div>
    </Layout>
  )
}
