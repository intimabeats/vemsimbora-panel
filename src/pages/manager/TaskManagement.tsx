import React, { useState } from 'react'
import { Layout } from '../../components/Layout'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageCircle 
} from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string
  project: string
  assignedTo: string[]
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'completed'
  dueDate: string
  checklist: { id: string, title: string, completed: boolean }[]
  comments: { user: string, text: string, date: string }[]
}

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Desenvolver Protótipo',
      description: 'Criar protótipo funcional do novo produto',
      project: 'Novo Produto',
      assignedTo: ['Carlos', 'Ana'],
      status: 'in_progress',
      dueDate: '2024-03-15',
      checklist: [
        { id: '1', title: 'Definir arquitetura', completed: true },
        { id: '2', title: 'Criar design inicial', completed: false },
        { id: '3', title: 'Implementar funcionalidades básicas', completed: false }
      ],
      comments: [
        { 
          user: 'Carlos', 
          text: 'Precisamos definir os requisitos principais', 
          date: '2024-02-20' 
        }
      ]
    }
  ])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const StatusBadge: React.FC<{ status: Task['status'] }> = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_approval: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    }

    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      waiting_approval: 'Aguardando Aprovação',
      completed: 'Concluída'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  return (
    <Layout role="manager">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Tarefas</h1>
          <button 
            onClick={() => {
              setSelectedTask(null)
              setIsModalOpen(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
          >
            <Plus className="mr-2" /> Criar Tarefa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {task.title}
                </h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditTask(task)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit size={20} />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{task.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="text-gray-500" size={16} />
                  <span className="text-gray-600">{task.assignedTo.join(', ')}</span>
                </div>
                <StatusBadge status={task.status} />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="text-gray-500" size={16} />
                  <span className="text-gray-600">{task.dueDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="text-gray-500" size={16} />
                  <span className="text-gray-600">{task.comments.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">
                {selectedTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
              </h2>
              
              <form className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Título da Tarefa" 
                  defaultValue={selectedTask?.title}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                
                <textarea 
                  placeholder="Descrição da Tarefa"
                  defaultValue={selectedTask?.description}
                  className="w-full px-4 py-2 border rounded-lg h-24"
                ></textarea>
                
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="w-full px-4 py-2 border rounded-lg"
                    defaultValue={selectedTask?.project}
                  >
                    <option>Selecionar Projeto</option>
                    <option>Novo Produto</option>
                    <option>Marketing Digital</option>
                  </select>
                  
                  <select 
                    multiple 
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option>Selecionar Responsáveis</option>
                    <option>Carlos</option>
                    <option>Ana</option>
                    <option>Maria</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="date" 
                    defaultValue={selectedTask?.dueDate}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  
                  <select 
                    className="w-full px-4 py-2 border rounded-lg"
                    defaultValue={selectedTask?.status}
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="waiting_approval">Aguardando Aprovação</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Checklist</h3>
                  {selectedTask?.checklist.map((item) => (
                    <div key={item.id} className="flex items-center mb-2">
                      <input 
                        type="checkbox" 
                        defaultChecked={item.completed}
                        className="mr-2"
                      />
                      <input 
                        type="text" 
                        defaultValue={item.title}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                    </div>
                  ))}
                  <button 
                    type="button"
                    className="text-blue-600 flex items-center mt-2"
                  >
                    <Plus className="mr-2" /> Adicionar Item
                  </button>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {selectedTask ? 'Atualizar Tarefa' : 'Criar Tarefa'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
