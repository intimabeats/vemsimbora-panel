// Adicionar ao arquivo existente
export interface TaskSchema {
  id: string
  projectId: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string[] // User IDs
  createdBy: string // User ID
  startDate?: number
  dueDate: number
  completedAt?: number
  coinsReward: number
  subtasks?: {
    id: string
    title: string
    completed: boolean
    completedAt?: number
  }[]
  comments?: {
    id: string
    userId: string
    text: string
    createdAt: number
  }[]
  attachments?: string[] // URLs or file references
  createdAt: number
  updatedAt: number
}
