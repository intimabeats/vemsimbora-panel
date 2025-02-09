import React, { useState } from 'react'
import { 
  Home, 
  User, 
  Briefcase, 
  Award, 
  Settings 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const MobileNavbar: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  const navItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      route: `/${currentUser?.role}/dashboard`,
      key: 'dashboard'
    },
    { 
      icon: Briefcase, 
      label: 'Projetos', 
      route: `/${currentUser?.role}/projects`,
      key: 'projects'
    },
    { 
      icon: Award, 
      label: 'Recompensas', 
      route: `/${currentUser?.role}/rewards`,
      key: 'rewards'
    },
    { 
      icon: User, 
      label: 'Perfil', 
      route: '/profile',
      key: 'profile'
    },
    { 
      icon: Settings, 
      label: 'Configurações', 
      route: `/${currentUser?.role}/settings`,
      key: 'settings'
    }
  ]

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
