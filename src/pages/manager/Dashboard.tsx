import React, { useState } from 'react'
import { Layout } from '../../components/Layout'
import { 
  BarChart2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users 
} from 'lucide-react'

const StatCard: React.FC<{
  icon: React.ElementType, 
  title: string, 
  value: string, 
  color: string
}> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-md flex items-center space-x-4 animate-fade-in">
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon className={`${color} w-6 h-6`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
)

export const ManagerDashboard: React.FC = () => {
  const [projects] = useState([
    {
      id: '1',
      name: 'Novo Produto',
      totalTasks: 25,
      completedTasks: 15,
      team: ['Carlos', 'Ana', 'Pedro']
    },
    {
      id: '2',
      name: 'Marketing Digital',
      totalTasks: 18,
      completedTasks: 10,
      team: ['Maria', 'João']
    }
  ])

  const [tasks] = useState([
    {
      id: '1',
      title: 'Desenvolver Protótipo',
      project: 'Novo Produto',
      status: 'in_progress',
      dueDate: '15/03/2024'
    },
    {
      id: '2',
      title: 'Criar Campanha',
      project: 'Marketing Digital',
      status: 'waiting_approval',
      dueDate: '28/02/2024'
    }
  ])

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusStyles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'waiting_approval': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800'
    }

    const statusLabels = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'waiting_approval': 'Aguardando',
      'completed': 'Concluída'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[status]}`}>
        {statusLabels[status]}
      </span>
    )
  }

  return (
    <Layout role="manager">
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Dashboard do Gestor
        </h1>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={BarChart2}
            title="Projetos Ativos"
            value={`${projects.length}`}
            color="text-blue-600"
          />
          <StatCard 
            icon={CheckCircle}
            title="Tarefas Concluídas"
            value="15"
            color="text-green-600"
          />
          <StatCard 
            icon={Clock}
            title="Tarefas Pendentes"
            value="10"
            color="text-yellow-600"
          />
          <StatCard 
            icon={AlertTriangle}
            title="Aguardando"
            value="5"
            color="text-purple-600"
          />
        </div>

        {/* Seções de Detalhes */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Projetos */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-blue-600" />
              Meus Projetos
            </h2>
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="mb-4 pb-4 border-b last:border-b-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">{project.name}</h3>
                  <span className="text-sm text-gray-600">
                    {project.completedTasks}/{project.totalTasks}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{
                      width: `${(project.completedTasks / project.totalTasks) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="mt-2 flex space-x-2">
                  {project.team.map((member, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tarefas Recentes */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2 text-green-600" />
              Tarefas Recentes
            </h2>
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="mb-4 pb-4 border-b last:border-b-0 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium text-gray-800 text-sm">
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-500">{task.project}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-gray-500">{task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
