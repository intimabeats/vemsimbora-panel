import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { auth } from '../config/firebase'
import { TaskSchema } from '../types/firestore-schema'
import { systemSettingsService } from './SystemSettingsService';

export class TaskService {
  private db = getFirestore()

  // Criar nova tarefa
    async createTask(taskData: Omit<TaskSchema, 'id' | 'createdAt' | 'updatedAt'>) {
    console.log("TaskService.createTask called with data:", taskData); // Log input
    try {
      const taskRef = doc(collection(this.db, 'tasks'));
        const settings = await systemSettingsService.getSettings(); // Fetch settings
        const coinsReward = Math.round(taskData.difficultyLevel * settings.taskCompletionBase * settings.complexityMultiplier);

      const newTask: TaskSchema = {
        id: taskRef.id,
        ...taskData,
        createdBy: auth.currentUser?.uid || '',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        coinsReward // Use calculated value
      }

      await setDoc(taskRef, newTask)
        console.log("Task created with ID:", taskRef.id); // Log success
      return newTask
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      throw error
    }
  }

  // Atualizar tarefa
  async updateTask(taskId: string, updates: Partial<TaskSchema>) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId);
        const settings = await systemSettingsService.getSettings(); // Fetch settings
        const coinsReward = Math.round((updates.difficultyLevel || 1 )* settings.taskCompletionBase * settings.complexityMultiplier); // Recalculate

      await updateDoc(taskRef, {
        ...updates,
        updatedAt: Date.now(),
        coinsReward
      })
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }
  }

  // Excluir tarefa
  async deleteTask(taskId: string) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      throw error
    }
  }

  // Buscar tarefas com paginação e filtros
  fetchTasks = async (options?: {
    projectId?: string
    status?: TaskSchema['status']
    assignedTo?: string
    limit?: number
    page?: number
  }) => {
    try {
      let q = query(collection(this.db, 'tasks'))

      // Filtros
      if (options?.projectId) {
        q = query(q, where('projectId', '==', options.projectId))
      }

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      if (options?.assignedTo) {
        q = query(q, where('assignedTo', 'array-contains', options.assignedTo))
      }

      // Ordenação
      q = query(q, orderBy('createdAt', 'desc'))

      // Executar consulta
      const snapshot = await getDocs(q)
      const allTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaskSchema))

      // Paginação
      const limit = options?.limit || 10
      const page = options?.page || 1
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedTasks = allTasks.slice(startIndex, endIndex)
      const totalPages = Math.ceil(allTasks.length / limit)

      return {
        data: paginatedTasks,
        totalPages,
        totalTasks: allTasks.length
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw error
    }
  }

  // Buscar tarefa por ID
  async getTaskById(taskId: string) {
    try {
      const taskRef = doc(this.db, 'tasks', taskId)
      const taskSnap = await getDoc(taskRef)

      if (taskSnap.exists()) {
        return {
          id: taskSnap.id,
          ...taskSnap.data()
        } as TaskSchema
      } else {
        throw new Error('Tarefa não encontrada')
      }
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      throw error
    }
  }
}

export const taskService = new TaskService()
