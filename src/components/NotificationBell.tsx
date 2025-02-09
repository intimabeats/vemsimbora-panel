import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle } from 'lucide-react'
import { NotificationService } from '../services/NotificationService'
import { Notification } from '../types/notification'
import { useAuth } from '../context/AuthContext'

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { currentUser } = useAuth()

  useEffect(() => {
    if (currentUser) {
      fetchNotifications()
    }
  }, [currentUser])

  const fetchNotifications = async () => {
    try {
      const userNotifications = await NotificationService.getUserNotifications(
        currentUser!.uid, 
        { limit: 5, unreadOnly: true }
      )
      setNotifications(userNotifications)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markNotificationAsRead(
        currentUser!.uid, 
        notificationId
      )
      fetchNotifications()
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notificações</h3>
            <button 
              onClick={() => {
                notifications.forEach(n => 
                  handleMarkAsRead(n.id)
                )
              }}
              className="text-blue-600 text-sm"
            >
              Marcar todas como lidas
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Sem novas notificações
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="p-4 border-b hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-blue-600"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
