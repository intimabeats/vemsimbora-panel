import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate, Link } from 'react-router-dom';
    import { Layout } from '../../components/Layout';
    import { taskService } from '../../services/TaskService';
    import { projectService } from '../../services/ProjectService';
    import { userManagementService } from '../../services/UserManagementService';
    import { TaskSchema, TaskAction } from '../../types/firestore-schema';
    import { ActionView } from '../../components/ActionView'; // Import ActionView
    import Confetti from 'react-confetti'; // Correct import
    import {
      CheckCircle,
      XCircle,
      Clock,
      File,
      Paperclip,
      Upload,
      User,
      Calendar,
      Check,
      X,
      FileText
    } from 'lucide-react';
    import { pulseKeyframes } from '../../utils/animation';


    export const TaskDetails: React.FC = () => {
      const { taskId } = useParams<{ taskId: string }>();
      const navigate = useNavigate();
      const [task, setTask] = useState<TaskSchema | null>(null);
      const [project, setProject] = useState<{ name: string } | null>(null); // Store project name
      const [users, setUsers] = useState<{ [key: string]: { name: string; profileImage?: string } }>({});
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [selectedAction, setSelectedAction] = useState<TaskAction | null>(null); // Track selected action
      const [statusChanged, setStatusChanged] = useState(false); // Track status changes
      const [showConfetti, setShowConfetti] = useState(false); // Control confetti visibility


      useEffect(() => {
        const loadTask = async () => {
          setIsLoading(true);
          setError(null);
          try {
            if (!taskId) {
              throw new Error('Task ID is required');
            }
            const fetchedTask = await taskService.getTaskById(taskId);
            setTask(fetchedTask);

            // Fetch project name
            const fetchedProject = await projectService.getProjectById(fetchedTask.projectId);
            setProject({ name: fetchedProject.name });

            // Fetch user data for assigned users and createdBy
            const userIds = [...fetchedTask.assignedTo, fetchedTask.createdBy];
            const uniqueUserIds = Array.from(new Set(userIds)); // Remove duplicates

            const usersData = await userManagementService.fetchUsers({ userIds: uniqueUserIds });
            const userMap = usersData.data.reduce((acc, user) => {
              acc[user.id] = { name: user.name, profileImage: user.profileImage };
              return acc;
            }, {} as { [key: string]: { name: string; profileImage?: string } });
            setUsers(userMap);

          } catch (err: any) {
            setError(err.message || 'Failed to load task');
          } finally {
            setIsLoading(false);
          }
        };

        loadTask();
      }, [taskId]);

      const handleActionComplete = async (actionId: string, data?: any) => {
        try {
          await taskService.completeTaskAction(taskId!, actionId, data);
          // Refresh task data
          const updatedTask = await taskService.getTaskById(taskId!);


          // Check for 100% completion and update status *before* updating local state
          const completedActions = updatedTask.actions.filter(action => action.completed).length;
          const totalActions = updatedTask.actions.length;
          const newProgress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
          if (newProgress === 100 && updatedTask.status !== 'completed') {
            await taskService.updateTask(taskId!, { status: 'completed' }); // Await the status update
            setStatusChanged(true); // Trigger pulse animation
            setShowConfetti(true);   // Show confetti
            setTimeout(() => setStatusChanged(false), 1000); // Reset after 1 second
          }
          setTask(updatedTask); // Now update the local state
          setSelectedAction(null); // Close the action view after completion
        } catch (error) {
          console.error('Error completing action:', error);
        }
      };

      const handleActionUncomplete = async (actionId: string) => {
        try {
          await taskService.uncompleteTaskAction(taskId!, actionId);
          // Refresh task data
          const updatedTask = await taskService.getTaskById(taskId!);
          setTask(updatedTask);
        } catch (error) {
          console.error('Error uncompleting action:', error);
        }
      };

      const handleFileUpload = async (actionId: string, file: File) => {
        try {
          const fileUrl = await taskService.uploadTaskAttachment(taskId!, file);
          await handleActionComplete(actionId, { fileUrl }); // Store the URL
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      };

      if (isLoading) {
        return <Layout isLoading={true} />; // Use your loading component
      }

      if (error) {
        return (
          <Layout>
            <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded">
              {error}
            </div>
          </Layout>
        );
      }

      if (!task) {
        return (
          <Layout>
            <div className="p-4 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded">
              Task not found.
            </div>
          </Layout>
        );
      }

      const completedActions = task.actions?.filter(action => action.completed).length ?? 0;
      const totalActions = task.actions?.length ?? 0;
      const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

      return (
        <Layout role="admin">
          <style>{pulseKeyframes}</style>
          <div className="container mx-auto p-6">
            {showConfetti && <Confetti onConfettiComplete={() => setShowConfetti(false)} />} {/* Conditionally render and control with onConfettiComplete */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                  <p className="text-gray-600 mt-2">
                    Project: <Link to={`/admin/projects/${task.projectId}`} className="text-blue-600 hover:underline">{project?.name}</Link>
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    } ${statusChanged ? 'animate-pulse' : ''}`}
                >
                  {task.status === 'completed' ? 'Concluída' : 'Em Andamento'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <span className="text-sm text-gray-500">Data de Vencimento</span>
                  <p className="font-medium">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Responsáveis</span>
                  <div className='flex'>
                    {task.assignedTo.map((userId) => {
                      const user = users[userId];
                      return (
                        <div key={userId} className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                          <img
                            src={user?.profileImage || 'https://via.placeholder.com/150'} // Provide a default image
                            alt={user?.name || 'Unknown User'}
                            className='object-cover w-full h-full'
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Criado Por</span>
                  <p className="font-medium">{users[task.createdBy]?.name || 'Unknown User'}</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Progresso da Tarefa</span>
                  <span className="text-sm font-medium text-blue-600">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {selectedAction ? (
                <ActionView
                  action={selectedAction}
                  onComplete={handleActionComplete}
                  onCancel={() => setSelectedAction(null)}
                  taskId={taskId!}
                />
              ) : (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Ações</h2>
                  <div className="space-y-4">
                    {task.actions?.map((action) => ( // Use optional chaining
                      <div key={action.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                action.completed
                                  ? handleActionUncomplete(action.id)
                                  : setSelectedAction(action) // Set selected action
                              }
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${action.completed ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                            >
                              {action.completed ? (
                                <Check className="text-white" size={16} />
                              ) : (
                                <X className="text-gray-700" size={16} />
                              )}
                            </button>
                            {!action.completed && (
                              <button
                                onClick={() => setSelectedAction(action)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                Perform Action
                              </button>
                            )}
                          </div>

                        </div>
                        <div className="text-sm text-gray-600">
                          {/* Display action type and any existing data */}
                          <p>Type: {action.type}</p>
                          {action.data && (
                            <p>Data: {JSON.stringify(action.data)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Layout>
      )
    }
