import React, { useState } from 'react'
import { 
  Home, 
  User, 
  Briefcase, 
  Award, 
  Settings,
  CheckCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const MobileNavbar: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Definir itens de menu com base na role do usuário
  const getNavItems = (role: string | undefined) => {
    const commonItems = [
      { 
        icon: Home, 
        label: 'Dashboard', 
        route: `/${role}/dashboard`,
        key: 'dashboard'
      },
      { 
        icon: User, 
        label: 'Perfil', 
        route: '/profile',
        key: 'profile'
      }
    ]

    const roleSpecificItems = {
      admin: [
        { 
          icon: Briefcase, 
          label: 'Projetos', 
          route: '/admin/projects',
          key: 'projects'
        },
        { 
          icon: CheckCircle, 
          label: 'Tarefas', 
          route: '/admin/tasks',
          key: 'tasks'
        },
        { 
          icon: Settings, 
          label: 'Configurações', 
          route: '/admin/settings',
          key: 'settings'
        }
      ],
      manager: [
        { 
          icon: Briefcase, 
          label: 'Projetos', 
          route: '/manager/projects',
          key: 'projects'
        },
        { 
          icon: CheckCircle, 
          label: 'Tarefas', 
          route: '/manager/tasks',
          key: 'tasks'
        }
      ],
      employee: [
        { 
          icon: Award, 
          label: 'Recompensas', 
          route: '/employee/rewards',
          key: 'rewards'
        },
        { 
          icon: CheckCircle, 
          label: 'Tarefas', 
          route: '/employee/tasks',
          key: 'tasks'
        }
      ]
    }

    return [...commonItems, ...(roleSpecificItems[role] || [])]
  }

  const navItems = getNavItems(currentUser?.role)

  const handleNavigation = (route: string, key: string) => {
    setActiveTab(key)
    navigate(route)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t z-50 md:hidden">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigation(item.route, item.key)}
            className={`flex flex-col items-center justify-center ${
              activeTab === item.key 
                ? 'text-blue-600' 
                : 'text-gray-500'
            }`}
          >
            <item.icon 
              size={24} 
              strokeWidth={activeTab === item.key ? 2.5 : 1.5} 
            />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
