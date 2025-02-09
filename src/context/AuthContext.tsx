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
import { 
  onAuthStateChanged, 
  User, 
  getIdToken 
} from 'firebase/auth'

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
    // Configurar listener de autenticação persistente
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Tentar restaurar dados do usuário do localStorage
          const storedUser = localStorage.getItem('user')
          
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            
            // Verificar validade do token
            const token = await getIdToken(user, true)
            
            setCurrentUser({
              ...user,
              role: parsedUser.role,
              coins: parsedUser.coins
            })
          } else {
            // Se não houver dados no localStorage, buscar do Firestore
            const userDoc = await AuthService.login(user.email!, '')
            setCurrentUser({
              ...user,
              role: userDoc.role,
              coins: userDoc.coins
            })
          }
        } catch (error) {
          console.error('Erro ao restaurar sessão:', error)
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
      
      setLoading(false)
    }, (error) => {
      console.error('Erro no listener de autenticação:', error)
      setCurrentUser(null)
      setLoading(false)
    })

    // Configurar listener de expiração de token
    const tokenListener = setInterval(async () => {
      if (currentUser) {
        try {
          await getIdToken(currentUser, true)
        } catch (error) {
          console.error('Token expirado:', error)
          await logout()
        }
      }
    }, 30 * 60 * 1000) // Verificar a cada 30 minutos

    // Limpar listeners
    return () => {
      unsubscribe()
      clearInterval(tokenListener)
    }
  }, [])

  // Métodos de autenticação
  const login = async (email: string, password: string) => {
    try {
      const user = await AuthService.login(email, password)
      
      // Salvar dados no localStorage
      localStorage.setItem('user', JSON.stringify({
        role: user.role,
        coins: user.coins
      }))

      setCurrentUser(user)
      return user
    } catch (error) {
      console.error('Erro de login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AuthService.logout()
      localStorage.removeItem('user')
      setCurrentUser(null)
    } catch (error) {
      console.error('Erro de logout:', error)
      throw error
    }
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
