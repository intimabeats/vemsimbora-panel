// User Schema
export interface UserSchema {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'employee'
  status: 'active' | 'inactive' | 'suspended'
  coins: number
  createdAt: number
  updatedAt: number
  profileImage?: string
  lastLogin?: number
}

// Project Schema
export interface ProjectSchema {
  id: string
  name: string
  description: string
  startDate: number
  endDate?: number
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  managers: string[]
  createdBy: string
  createdAt: number
  updatedAt: number
  messages?: {
    id: string
    userId: string
    userName: string
    content: string
    timestamp: number
    attachments?: {
      id: string
      name: string
      url: string
      type: 'image' | 'video' | 'document' | 'link' | 'other'
      size?: number
    }[]
  }[]
}

// Task Schema
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
  difficultyLevel: number // Difficulty level 0-10
  coinsReward: number // Calculated reward
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
    attachments?: string[] // URLs or file references
  }[]
  attachments?: string[] // URLs or file references
  createdAt: number
  updatedAt: number
}

// Reward Schema
export interface RewardSchema {
  id: string
  userId: string
  type: 'task_completion' | 'monthly_bonus' | 'special_achievement'
  amount: number
  description: string
  timestamp: number
  projectId?: string
  taskId?: string
}

// Notification Schema
export interface NotificationSchema {
  id: string
  userId: string
  type: 'task_created' | 'task_assigned' | 'task_completed' | 'project_update' | 'reward_earned'
  title: string
  message: string
  read: boolean
  timestamp: number
  relatedEntityId?: string
  sender?: string
}

// System Settings Schema
export interface SystemSettingsSchema {
  taskCompletionBase: number
  complexityMultiplier: number
  monthlyBonus: number
  twoFactorAuth: boolean
  passwordResetFrequency: number
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReports: boolean
}
