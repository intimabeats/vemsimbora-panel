import React, { useState, useEffect } from 'react'
    import { Layout } from '../../components/Layout'
    import {
      BarChart2,
      Briefcase,
      Users,
      CheckCircle,
      AlertTriangle
    } from 'lucide-react'
    import { projectService } from '../../services/ProjectService'
    import { userManagementService } from '../../services/UserManagementService'
    import { taskService } from '../../services/TaskService'


    const StatCard: React.FC<{
      icon: React.ElementType,
      title: string,
      value: string | number, // Allow numbers
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

    // Reusable Progress Bar Component
    const ProgressBar: React.FC<{ name: string; progress: number; color: string }> = ({ name, progress, color }) => (
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{name}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    )

    export const AdminDashboard: React.FC = () => {
      const [isLoading, setIsLoading] = useState(true);
      const [projectCount, setProjectCount] = useState(0);
      const [userCount, setUserCount] = useState(0);
      const [completedTasksCount, setCompletedTasksCount] = useState(0);
      const [pendingTasksCount, setPendingTasksCount] = useState(0);
      const [projectsProgress, setProjectsProgress] = useState<{ name: string; progress: number; color: string }[]>([]);
      const [recentActivities, setRecentActivities] = useState<{ user: string; action: string; project: string; time: string }[]>([]);
      const [error, setError] = useState<string | null>(null); // Add error state


      useEffect(() => {
        const fetchData = async () => {
          setIsLoading(true);
          setError(null); // Clear any previous errors
          try {
            const projects = await projectService.fetchProjects();
            setProjectCount(projects.totalProjects);

            const users = await userManagementService.fetchUsers();
            setUserCount(users.totalUsers);

            const completedTasks = await taskService.fetchTasks({ status: 'completed' });
            setCompletedTasksCount(completedTasks.totalTasks);

            const pendingTasks = await taskService.fetchTasks({ status: 'pending' });
            setPendingTasksCount(pendingTasks.totalTasks);

            // Simulate project progress data (replace with actual data fetching)
            setProjectsProgress([
              { name: "Novo Produto", progress: 75, color: "bg-blue-500" },
              { name: "Marketing Digital", progress: 45, color: "bg-green-500" },
              { name: "Infraestrutura", progress: 90, color: "bg-purple-500" },
              { name: "Treinamento RH", progress: 30, color: "bg-yellow-500" }
            ]);

            // Simulate recent activity data
            setRecentActivities([
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
            ]);


          } catch (err: any) {
            setError(err.message || 'Erro ao buscar dados.'); // Set error message
            console.error("Error fetching data:", err);
          } finally {
            setIsLoading(false);
          }
        };

        fetchData();
      }, []);


      return (
        <Layout role="admin" isLoading={isLoading}>
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Briefcase}
                title="Projetos"
                value={projectCount}
                color="text-blue-600"
              />
              <StatCard
                icon={Users}
                title="Usuários"
                value={userCount}
                color="text-green-600"
              />
              <StatCard
                icon={CheckCircle}
                title="Tarefas Concluídas"
                value={completedTasksCount}
                color="text-purple-600"
              />
              <StatCard
                icon={AlertTriangle}
                title="Pendentes"
                value={pendingTasksCount}
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
                  {projectsProgress.map((project, index) => (
                    <ProgressBar key={index} {...project} />
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
                  {recentActivities.map((activity, index) => (
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
