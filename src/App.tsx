import React from 'react'
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom'
import * as Sentry from "@sentry/react"
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

// Import pages
import { Login } from './pages/auth/Login'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { Profile } from './pages/Profile'
import { Unauthorized } from './pages/Unauthorized'

// Admin Imports
import { AdminDashboard } from './pages/admin/Dashboard'
import { UserManagement } from './pages/admin/UserManagement'
import { ProjectManagement } from './pages/admin/ProjectManagement'
import { TaskManagement } from './pages/admin/TaskManagement'

// Manager Imports
import { ManagerDashboard } from './pages/manager/Dashboard'

// Employee Imports
import { EmployeeDashboard } from './pages/employee/Dashboard'

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Profile Route */}
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/user-management" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <UserManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/projects" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <ProjectManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/tasks" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <TaskManagement />
                </PrivateRoute>
              } 
            />

            {/* Manager Routes */}
            <Route 
              path="/manager/dashboard" 
              element={
                <PrivateRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </PrivateRoute>
              } 
            />

            {/* Employee Routes */}
            <Route 
              path="/employee/dashboard" 
              element={
                <PrivateRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </PrivateRoute>
              } 
            />

            {/* Redirect */}
            <Route 
              path="/" 
              element={<Navigate to="/login" replace />} 
            />

            {/* 404 Not Found */}
            <Route 
              path="*" 
              element={<div>Página não encontrada</div>} 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default Sentry.withProfiler(App)
