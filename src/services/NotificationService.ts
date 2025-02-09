import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore'
import { auth } from '../config/firebase'
import { Notification, NotificationType } from '../types/notification'

export class NotificationService {
  private db = getFirestore()

  // Criar nova notificação
  static async createNotification(
    userId: string, 
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) {
    const db = getFirestore()
    
    try {
      const notificationData = {
        ...notification,
        timestamp: Date.now(),
        read: false
      }

      const docRef = await addDoc(
        collection(db, 'users', userId, 'notifications'), 
        notificationData
      )

      return { ...notificationData, id: docRef.id }
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      throw error
    }
  }

  // Buscar notificações do usuário
  static async getUserNotifications(
    userId: string, 
    options?: { 
      limit?: number, 
      unreadOnly?: boolean 
    }
  ) {
    const db = getFirestore()
    
    try {
      let notificationsQuery = query(
        collection(db, 'users', userId, 'notifications'),
        orderBy('timestamp', 'desc')
      )

      // Filtrar apenas não lidas
      if (options?.unreadOnly) {
        notificationsQuery = query(
          notificationsQuery, 
          where('read', '==', false)
        )
      }

      // Limitar número de notificações
      if (options?.limit) {
        notificationsQuery = query(
          notificationsQuery, 
          limit(options.limit)
        )
      }

      // Implementação real seria com onSnapshot para tempo real
      const snapshot = await getDocs(notificationsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification))
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      throw error
    }
  }

  // Marcar notificação como lida
  static async markNotificationAsRead(
    userId: string, 
    notificationId: string
  ) {
    const db = getFirestore()
    
    try {
      const notificationRef = doc(
        db, 
        'users', 
        userId, 
        'notifications', 
        notificationId
      )

      await updateDoc(notificationRef, { read: true })
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw error
    }
  }

  // Limpar notificações antigas
  static async clearOldNotifications(
    userId: string, 
    daysOld: number = 30
  ) {
    const db = getFirestore()
    
    try {
      const thresholdTimestamp = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
      
      const notificationsQuery = query(
        collection(db, 'users', userId, 'notifications'),
        where('timestamp', '<', thresholdTimestamp)
      )

      const snapshot = await getDocs(notificationsQuery)
      
      snapshot.docs.forEach(async (document) => {
        await deleteDoc(doc(db, 'users', userId, 'notifications', document.id))
      })
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error)
      throw error
    }
  }
}

// Funções auxiliares para criar notificações comuns
export const NotificationHelpers = {
  taskCreated: (taskTitle: string, assignedTo: string) => ({
    type: 'task_created' as NotificationType,
    title: 'Nova Tarefa Criada',
    message: `A tarefa "${taskTitle}" foi criada e atribuída a você.`
  }),

  taskApproved: (taskTitle: string, rewardCoins: number) => ({
    type: 'task_approved' as NotificationType,
    title: 'Tarefa Aprovada',
    message: `Sua tarefa "${taskTitle}" foi aprovada. Você ganhou ${rewardCoins} moedas!`
  })
}
