import React, { useState, useEffect } from 'react'
    import {
      CheckCircle,
      X,
      AlertTriangle
    } from 'lucide-react'
    import { taskService } from '../../services/TaskService'
    import { projectService } from '../../services/ProjectService'
    import { userManagementService } from '../../services/UserManagementService'
    import { TaskSchema } from '../../types/firestore-schema'
    import { systemSettingsService } from '../../services/SystemSettingsService'

    interface EditTaskModalProps {
      task: TaskSchema
      isOpen: boolean
      onClose: () => void
      onTaskUpdated: (task: TaskSchema) => void
    }

    export const EditTaskModal: React.FC<EditTaskModalProps> = ({
      task,
      isOpen,
      onClose,
      onTaskUpdated
    }) => {
      const [step, setStep] = useState(1)
      const [formData, setFormData] = useState({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
        priority: task.priority,
        status: task.status,
        dueDate: new Date(task.dueDate).toISOString().split('T')[0],
        difficultyLevel: task.difficultyLevel
      })

      const [projects, setProjects] = useState<{ id: string, name: string }[]>([])
      const [users, setUsers] = useState<{ id: string, name: string }[]>([])
      const [loading, setLoading] = useState(false)
      const [error, setError] = useState<string | null>(null)
        const [baseReward, setBaseReward] = useState(10); // Default value
        const [complexityMultiplier, setComplexityMultiplier] = useState(1.5);
        const [coinsReward, setCoinsReward] = useState(0);
        const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

        // Fetch base reward and complexity multiplier on modal open
        useEffect(() => {
            const fetchSettings = async () => {
                try {
                    const settings = await systemSettingsService.getSettings();
                    setBaseReward(settings.taskCompletionBase);
                    setComplexityMultiplier(settings.complexityMultiplier);
                } catch (err) {
                    console.error("Error fetching system settings:", err);
                    // Don't set an error here, use default values.
                }
            };

            if (isOpen) {
                fetchSettings();
            }
        }, [isOpen]);

        // Calculate coinsReward whenever difficultyLevel, baseReward, or complexityMultiplier changes
        useEffect(() => {
            setCoinsReward(Math.round(baseReward * formData.difficultyLevel * complexityMultiplier));
        }, [formData.difficultyLevel, baseReward, complexityMultiplier]);

      useEffect(() => {
        const fetchData = async () => {
          try {
            const [projectsData, usersData] = await Promise.all([
              projectService.fetchProjects(),
              userManagementService.fetchUsers()
            ])

            setProjects(projectsData.data.map(p => ({ id: p.id, name: p.name })))
            setUsers(usersData.data.map(u => ({ id: u.id, name: u.name })))
          } catch (err) {
            console.error('Erro ao buscar dados:', err)
            setError('Erro ao carregar projetos e usuários')
          }
        }

        if (isOpen) {
          fetchData()
        }
      }, [isOpen])

      // Resetar estado quando a tarefa mudar
      useEffect(() => {
        setFormData({
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          assignedTo: task.assignedTo,
          priority: task.priority,
          status: task.status,
          dueDate: new Date(task.dueDate).toISOString().split('T')[0],
          difficultyLevel: task.difficultyLevel
        })
        setError(null)
      }, [task])

      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const { name, value } = e.target
        setFormData(prev => ({
          ...prev,
          [name]: name === 'assignedTo'
            ? Array.from(
              (e.target as HTMLSelectElement).selectedOptions,
              option => option.value
            )
            : value
        }));
          // Clear specific field error when it changes
          if (formErrors[name]) {
            setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
          }
      }

        const validateStep1 = () => {
            const errors: { [key: string]: string } = {};
            if (!formData.title.trim()) {
                errors.title = 'O título é obrigatório.';
            }
            if (!formData.description.trim()) {
                errors.description = 'A descrição é obrigatória.';
            }
            if (!formData.projectId) {
                errors.projectId = 'Selecione um projeto.';
            }
            if (formData.assignedTo.length === 0) {
                errors.assignedTo = 'Selecione pelo menos um responsável.';
            }
            setFormErrors(errors);
            return Object.keys(errors).length === 0; // Returns true if no errors
        };

        const validateStep2 = () => {
            const errors: {[key: string]: string} = {};
            if (!formData.dueDate) {
              errors.dueDate = "Selecione uma data de entrega.";
            }
            setFormErrors(errors);
            return Object.keys(errors).length === 0;
        }

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
          const updateData: Partial<TaskSchema> = {
            ...formData,
            dueDate: new Date(formData.dueDate).getTime(),
            updatedAt: Date.now(),
            coinsReward
          }

          await taskService.updateTask(task.id, updateData)

          onTaskUpdated({
            ...task,
            ...updateData
          })

          onClose()
        } catch (err: any) {
          setError(err.message || 'Erro ao atualizar tarefa')
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
                <CheckCircle className="mr-2 text-blue-600" />
                Editar Tarefa ({step}/2)
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

              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título da Tarefa
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.title ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    />
                    {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
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
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 h-24 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    />
                    {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Projeto
                    </label>
                    <select
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.projectId ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    >
                      <option value="">Selecione um Projeto</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.projectId && <p className="text-red-500 text-xs mt-1">{formErrors.projectId}</p>}
                  </div>

                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prioridade
                        </label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                        </select>
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsáveis
                    </label>
                    <select
                      multiple
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 h-24 ${formErrors.assignedTo ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.assignedTo && <p className="text-red-500 text-xs mt-1">{formErrors.assignedTo}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        if(validateStep1()) {
                            setStep(2)
                        }
                    }}
                    className={`w-full py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition ${!validateStep1() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!validateStep1()}
                  >
                    Próximo
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nível de Dificuldade (1-10)
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                        <button
                          key={level}
                          type="button"
                          className={`px-3 py-1 rounded-full text-sm ${formData.difficultyLevel === level
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          onClick={() => setFormData({ ...formData, difficultyLevel: level })}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recompensa Estimada (Moedas)
                        </label>
                        <input
                            type="text"
                            value={coinsReward}
                            readOnly
                            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700"
                        />
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.dueDate ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}

                    />
                    {formErrors.dueDate && <p className="text-red-500 text-xs mt-1">{formErrors.dueDate}</p>}

                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || !validateStep2()}
                      className={`w-full py-2 rounded-lg text-white transition 
                ${loading || !validateStep2()
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      {loading ? 'Atualizando...' : 'Atualizar Tarefa'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Voltar
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )
    }
