import React, { ReactNode, useState, useEffect } from 'react' // Import useState and useEffect
import { MobileNavbar } from './MobileNavbar'
import {
  Home,
  Users,
  Briefcase,
  Settings,
  LogOut,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'
import { LoadingScreen } from './LoadingScreen'


type Role = 'admin' | 'manager' | 'employee';

type SidebarProps = {
  role: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { logout, currentUser } = useAuth()
  const navigate = useNavigate()

  const commonLinks = [
    { icon: Home, label: 'Dashboard', href: `/${role}/dashboard` }
  ]

  const roleSpecificLinks = {
    admin: [
      { icon: Users, label: 'Usuários', href: '/admin/user-management' },
      { icon: Briefcase, label: 'Projetos', href: '/admin/projects' },
      { icon: CheckCircle, label: 'Tarefas', href: '/admin/tasks' },
      { icon: Settings, label: 'Configurações', href: '/admin/settings' },
    ],
    manager: [
      { icon: Briefcase, label: 'Projetos', href: '/manager/projects' },
      { icon: CheckCircle, label: 'Tarefas', href: '/manager/tasks' },
      { icon: Settings, label: 'Configurações', href: '/manager/settings' }
    ],
    employee: [
      { icon: CheckCircle, label: 'Tarefas', href: '/employee/tasks' },
      { icon: Settings, label: 'Configurações', href: '/employee/settings' }
    ]
  }

  const links = [...commonLinks, ...(roleSpecificLinks[role] || [])];

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }



  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r shadow-md h-screen fixed left-0 top-0 p-4 flex flex-col">
        <div className="flex items-center mb-8">
          <img
            src={currentUser?.photoURL || "https://images.unsplash.com/photo-1560179707-f14e90ef3623"}
            alt="Vem Simbora Logo"
            className="w-12 h-12 rounded-full mr-4 object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentUser?.displayName || 'Usuário'}
            </h2>
            <p className="text-sm text-gray-500 capitalize">{role}</p>
          </div>
          <NotificationBell />
        </div>

        <nav className="flex-1">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="flex items-center py-3 px-4 hover:bg-gray-100 rounded-lg transition"
            >
              <link.icon className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-700">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
          >
            <LogOut className="mr-2" size={20} /> Sair
          </button>
        </div>
      </div>
    </>
  )
}

export const Layout: React.FC<{
  children: ReactNode,
  role?: Role,
  isLoading?: boolean,
  hideNavigation?: boolean;
}> = ({ children, role = 'employee', isLoading = false, hideNavigation = false }) => {


  return (
    <div className="flex">
      {!hideNavigation && <Sidebar role={role} />}
      <main className={`${!hideNavigation ? 'md:ml-64' : ''} w-full bg-gray-50 min-h-screen pt-safe-top`}> {/* Removed padding-bottom */}
        {isLoading ? <LoadingScreen /> : children}
      </main>
      {!hideNavigation && <MobileNavbar role={role} />}
    </div>
  )
}
