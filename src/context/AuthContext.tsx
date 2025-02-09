import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect 
} from 'react'
import { 
  auth, 
  AuthService, 
  SessionService, 
  TokenService 
} from '../config/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

// User roles type
type UserRole = 'admin' | 'manager' | 'employee'

// Extended user interface
interface ExtendedUser extends User {
  role?: UserRole
  coins?: number
}

// Auth context type
type AuthContextType = {
  currentUser: ExtendedUser | null
  login: (email: string, password: string) => Promise<ExtendedUser>
  logout: () => Promise<void>
  refreshToken: () => Promise<string>
  checkTokenClaims: () => Promise<{
    admin: boolean
    manager: boolean
    employee: boolean
  }>
}

// Create context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => ({} as ExtendedUser),
  logout: async () => {},
  refreshToken: async () => '',
  checkTokenClaims: async () => ({
    admin: false,
    manager: false,
    employee: false
  })
})

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tentar restaurar sessão ao montar o componente
    const restoreSession = async () => {
      const storedUser = await SessionService.restoreSession()
      
      if (storedUser) {
        setCurrentUser(storedUser)
      }
      
      setLoading(false)
    }

    // Listener de mudança de estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Buscar dados do usuário
          const userDoc = await AuthService.login(user.email!, '')
          setCurrentUser(userDoc)
        } catch (error) {
          console.error('Falha ao buscar dados do usuário', error)
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
      
      setLoading(false)
    })

    restoreSession()

    // Limpar subscription
    return () => {
      unsubscribe()
    }
  }, [])

  // Métodos de autenticação
  const login = async (email: string, password: string) => {
    const user = await AuthService.login(email, password)
    setCurrentUser(user)
    return user
  }

  const logout = async () => {
    await AuthService.logout()
    setCurrentUser(null)
  }

  const refreshToken = async () => {
    if (!currentUser) {
      throw new Error('Nenhum usuário autenticado')
    }
    return TokenService.refreshToken(currentUser)
  }

  const checkTokenClaims = async () => {
    if (!currentUser) {
      throw new Error('Nenhum usuário autenticado')
    }
    return TokenService.checkTokenClaims(currentUser)
  }

  // Valor do contexto
  const value = {
    currentUser,
    login,
    logout,
    refreshToken,
    checkTokenClaims
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Custom hook para usar o contexto de autenticação
export const useAuth = () => {
  return useContext(AuthContext)
}
