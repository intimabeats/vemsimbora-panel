import React from 'react'
import { Layout } from '../../components/Layout'
import { 
  BarChart2, 
  Briefcase, 
  Users, 
  CheckCircle, 
  AlertTriangle 
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

export const AdminDashboard: React.FC = () => {
  return (
    <Layout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
        
        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Briefcase}
            title="Projetos"
            value="24"
            color="text-blue-600"
          />
          <StatCard 
            icon={Users}
            title="Usuários"
            value="87"
            color="text-green-600"
          />
          <StatCard 
            icon={CheckCircle}
            title="Tarefas Concluídas"
            value="156"
            color="text-purple-600"
          />
          <StatCard 
            icon={AlertTriangle}
            title="Pendentes"
            value="42"
            color="text-yellow-600"
          />
        </div>

        {/* Seções de Detalhes */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Progresso de Projetos */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart2 className="mr-2 text-blue-600" />
              Progresso dos Projetos
            </h2>
            <div className="space-y-4">
              {[
                { name: "Novo Produto", progress: 75, color: "bg-blue-500" },
                { name: "Marketing Digital", progress: 45, color: "bg-green-500" },
                { name: "Infraestrutura", progress: 90, color: "bg-purple-500" },
                { name: "Treinamento RH", progress: 30, color: "bg-yellow-500" }
              ].map((project, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{project.name}</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${project.color} h-2 rounded-full`} 
                      style={{width: `${project.progress}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-green-600" />
              Atividade Recente
            </h2>
            <div className="space-y-4">
              {[
                { 
                  user: "Carlos Silva", 
                  action: "Concluiu Tarefa", 
                  project: "Novo Produto",
                  time: "2 horas atrás"
                },
                { 
                  user: "Maria Santos", 
                  action: "Iniciou Projeto", 
                  project: "Marketing Digital",
                  time: "5 horas atrás"
                },
                { 
                  user: "João Oliveira", 
                  action: "Adicionou Nova Tarefa", 
                  project: "Infraestrutura",
                  time: "1 dia atrás"
                }
              ].map((activity, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center pb-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{activity.user}</p>
                    <p className="text-xs text-gray-500">
                      {activity.action} em {activity.project}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
