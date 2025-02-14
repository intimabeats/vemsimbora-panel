import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { taskService } from '../../services/TaskService';
import { projectService } from '../../services/ProjectService';
import { userManagementService } from '../../services/UserManagementService';
import { TaskSchema, TaskAction } from '../../types/firestore-schema';
import { ActionView } from '../../components/ActionView';
import Confetti from 'react-confetti';
import {
  CheckCircle,
  XCircle,
  Clock,
  File,
  Paperclip,
  User,
  Calendar,
  Check,
  X,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MoreVertical, // For a dropdown menu
  CornerUpLeft // Icon for "Voltar para Pendente"
} from 'lucide-react';
import { pulseKeyframes } from '../../utils/animation';
import { getDefaultProfileImage } from '../../utils/user';
import { AttachmentDisplay } from '../../components/AttachmentDisplay';
import { useAuth } from '../../context/AuthContext'; // Corrected import


export const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskSchema | null>(null);
  const [project, setProject] = useState<{ name: string } | null>(null); // Keep for project link, even if not displayed
  const [users, setUsers] = useState<{ [key: string]: { name: string; profileImage?: string } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<TaskAction | null>(null); // Track selected action
  const [statusChanged, setStatusChanged] = useState(false); // Track status changes
  const [showConfetti, setShowConfetti] = useState(false); // Control confetti visibility
  const [fadeOut, setFadeOut] = useState(false); // NEW: Control fade-out animation
    const { currentUser } = useAuth(); // Get the current user


  useEffect(() => {
    const loadTask = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!taskId) {
          throw new Error('O ID da tarefa é obrigatório.');
        }
        const fetchedTask = await taskService.getTaskById(taskId);
        setTask(fetchedTask);

        const fetchedProject = await projectService.getProjectById(fetchedTask.projectId);
        setProject({ name: fetchedProject.name });

        const userIds = [...fetchedTask.assignedTo, fetchedTask.createdBy];
        const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean); // Remove duplicates and falsy values

        const usersData = await userManagementService.fetchUsers({ userIds: uniqueUserIds });
        const userMap = usersData.data.reduce((acc, user) => {
          acc[user.id] = { name: user.name, profileImage: user.profileImage };
          return acc;
        }, {} as { [key: string]: { name: string; profileImage?: string } });
        setUsers(userMap);

      } catch (err: any) {
        setError(err.message || 'Falha ao carregar a tarefa.');
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
      setTask({ ...updatedTask }); // CRITICAL: Create a new object
      setSelectedAction(null); // Close the action view
    } catch (error) {
      console.error('Error completing action:', error);
    }
  };

  const handleActionUncomplete = async (actionId: string) => {
    try {
      await taskService.uncompleteTaskAction(taskId!, actionId);
      // Refresh task data.  CRITICAL for reactivity.
      const updatedTask = await taskService.getTaskById(taskId!);
      setTask({ ...updatedTask }); // Use spread operator for correct update
    } catch (error) {
      console.error('Error uncompleting action:', error);
    }
  };

    // NEW: Handle submitting task for approval
    const handleSubmitForApproval = async () => {
        try {
            await taskService.updateTask(taskId!, { status: 'waiting_approval' });
            // Refresh task data after status update
            const updatedTask = await taskService.getTaskById(taskId!);
            setTask(updatedTask);
        } catch (error) {
            console.error("Error submitting for approval:", error);
            setError("Failed to submit the task for approval.");
        }
    };

    // NEW: Handle task completion (approval) - FOR ADMIN/MANAGER
    const handleCompleteTask = async () => {
        try {
            await taskService.updateTask(taskId!, { status: 'completed' });
            setStatusChanged(true); // Trigger pulse animation
            setShowConfetti(true);   // Show confetti
            setTimeout(() => {
                setStatusChanged(false);
                setFadeOut(true); // Start fade-out animation
                setTimeout(() => setShowConfetti(false), 1000); //  Hide after fade-out (1s)
            }, 4000); //  Confetti visible for 4 seconds

            // Refresh task data after status update
            const updatedTask = await taskService.getTaskById(taskId!);
            setTask(updatedTask);

        } catch (error) {
            console.error("Error completing task:", error);
            setError("Failed to complete the task."); // Set an error message
        }
    };

     // Handle reverting task to pending
    const handleRevertToPending = async () => {
        try {
            await taskService.updateTask(taskId!, { status: 'pending' });
            const updatedTask = await taskService.getTaskById(taskId!);
            setTask(updatedTask);
        } catch (error) {
            console.error("Error reverting task to pending:", error);
            setError("Failed to revert task to pending.");
        }
    };



  if (isLoading) {
    return <Layout isLoading={true} />; // Use your loading component
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded flex items-center">
        <AlertTriangle className="mr-2" size={20} />
          {error}
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="p-4 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded flex items-center">
          <AlertTriangle className="mr-2" size={20} />
          Tarefa não encontrada.
        </div>
      </Layout>
    );
  }

  const completedActions = task.actions?.filter(action => action.completed).length ?? 0;
  const totalActions = task.actions?.length ?? 0;
  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

    // Check if all actions are completed *outside* of event handlers
    const allActionsCompleted = totalActions > 0 && completedActions === totalActions;


    // Helper function for consistent date formatting
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR');
    };



  return (
    <Layout role="admin">
      <style>{pulseKeyframes}</style>
      <div className="container mx-auto p-6">
      {showConfetti && <Confetti onConfettiComplete={() => setFadeOut(false)}  className={fadeOut ? 'fade-out-confetti' : ''} />}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-blue-600">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : task.status === 'waiting_approval'
                  ? 'bg-purple-100 text-purple-800' // Style for waiting_approval
                  : 'bg-yellow-100 text-yellow-800'
              } ${statusChanged ? 'animate-pulse' : ''}`}
            >
              {task.status === 'completed'
                ? 'Concluída'
                : task.status === 'waiting_approval'
                ? 'Aguardando Aprovação'
                : 'Pendente'}
            </span>
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
              <p className="text-gray-900">{formatDate(task.dueDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsável</label>
              <div className="flex items-center mt-1">
                {task.assignedTo ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                        <img
                            src={users[task.assignedTo]?.profileImage || getDefaultProfileImage(users[task.assignedTo]?.name || null)}
                            alt={users[task.assignedTo]?.name || 'Usuário Desconhecido'}
                            className="object-cover w-full h-full"
                        />
                        <span>{users[task.assignedTo]?.name || 'Usuário Desconhecido'}</span>
                    </div>
                ) : (
                    <span className="text-gray-500">Nenhum responsável atribuído</span>
                )}
              </div>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Projeto</label>
            <p className="text-gray-900">
                <Link to={`/admin/projects/${task.projectId}`} className="text-blue-600 hover:underline">
                    {project?.name || 'Projeto Desconhecido'}
                </Link>
            </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress.toFixed(0)}%` }}
            />
          </div>
            <div className='flex justify-between'>
                <span>Progresso: {progress.toFixed(0)}%</span>
                <span>Recompensa: {task.coinsReward}</span>
            </div>

          {/* Task Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Descrição</h2>
            <p className="text-gray-600">{task.description}</p>
          </div>

          {/* Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações</h2>
            <div className="space-y-4">
              {task.actions?.map((action) => (
                <div key={action.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    {/* Display the description instead of the type */}
                    <p className="text-sm text-gray-500">{action.description}</p>
                    {action.data && (
                      <p className="text-sm text-gray-500">
                        Dados: {JSON.stringify(action.data)}
                      </p>
                    )}
                    {action.completed && action.completedBy && users[action.completedBy] && (
                        <div className="flex items-center mt-2">
                            <img
                                src={users[action.completedBy]?.profileImage || getDefaultProfileImage(users[action.completedBy]?.name || null)}
                                alt={users[action.completedBy]?.name || 'Usuário Desconhecido'}
                                className="w-6 h-6 rounded-full mr-2"
                            />
                            <span className="text-sm text-gray-600">
                                Completo por: {users[action.completedBy]?.name || 'Usuário Desconhecido'}
                            </span>
                        </div>
                    )}
                  </div>
                  <div>
                    {/* Only show action buttons if task is NOT waiting for approval or completed */}
                    {task.status !== 'waiting_approval' && task.status !== 'completed' && (
                        <>
                        {action.completed ? (
                        <button
                            onClick={() => handleActionUncomplete(action.id)}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                        >
                            Desfazer
                        </button>
                        ) : (
                        <button
                            onClick={() => setSelectedAction(action)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Completar
                        </button>
                        )}
                        </>
                    )}
                  </div>
                </div>
              ))}
              {task.actions?.length === 0 && (
                <p className="text-gray-500">Nenhuma ação definida para esta tarefa.</p>
              )}
            </div>
          </div>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Anexos</h2>
                    <div className='flex gap-2'>
                        {task.attachments.map((attachmentUrl, index) => (
                            <AttachmentDisplay  key={index} attachment={{
                                id: index.toString(), //  ID is required by your component
                                name: attachmentUrl.substring(attachmentUrl.lastIndexOf('/') + 1), // Extract filename
                                url: attachmentUrl,
                                type: 'other', // You'll need to determine the actual type
                            }} />
                        ))}
                    </div>
                </div>
            )}

            {/* "Submit for Approval" Button - Conditionally Rendered */}
            {allActionsCompleted && task.status !== 'waiting_approval' && task.status !== 'completed' && (
                <button
                    onClick={handleSubmitForApproval}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                    <CheckCircle className="mr-2" />
                    Enviar para Aprovação
                </button>
            )}

            {/* "Approve Task" Button - For Admin/Manager, only when waiting_approval */}
            {currentUser?.role === 'admin' && task.status === 'waiting_approval' && (
                <button
                    onClick={handleCompleteTask}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                >
                    <CheckCircle className="mr-2" />
                    Aprovar Tarefa ({task.coinsReward} Moedas)
                </button>
            )}
            {/* "Revert to Pending" Button - For Admin, only when waiting_approval */}
            {currentUser?.role === 'admin' && task.status === 'waiting_approval' && (
                <button
                    onClick={handleRevertToPending}
                    className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center justify-center mt-2"
                >
                    <CornerUpLeft className="mr-2" />
                    Voltar para Pendente
                </button>
            )}

          {/* Selected Action (Modal-like) */}
          {selectedAction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <ActionView
                  action={selectedAction}
                  onComplete={handleActionComplete}
                  onCancel={() => setSelectedAction(null)}
                  taskId={taskId!}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}