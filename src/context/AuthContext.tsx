// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from 'react'
import {
  auth,
  AuthService,
  TokenService
} from '../config/firebase'
import {
  onAuthStateChanged,
  User,
  getIdToken,
  sendPasswordResetEmail
} from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'

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
  resetPassword: (email: string) => Promise<void>
  setCurrentUser: React.Dispatch<React.SetStateAction<ExtendedUser | null>>
}

// Create context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => ({} as ExtendedUser),
  logout: async () => { },
  refreshToken: async () => '',
  checkTokenClaims: async () => ({
    admin: false,
    manager: false,
    employee: false
  }),
  resetPassword: async () => { },
  setCurrentUser: () => {}
})

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  const updateUser = useCallback(async (user: User | null) => {
    console.log("AuthContext updateUser - user:", user);
    if (user) {
      try {
        // Try to restore user data from localStorage
        const storedUser = localStorage.getItem('user')

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          console.log("AuthContext updateUser - storedUser:", parsedUser);

          // Verify token validity
          await getIdToken(user, true)

          // Get fresh user data from Firestore to ensure it's up to date
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setCurrentUser({
              ...user,
              role: userData.role,
              coins: userData.coins
            })
            
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify({
              role: userData.role,
              coins: userData.coins
            }))
          } else {
            // If user document doesn't exist in Firestore, use stored data
            setCurrentUser({
              ...user,
              role: parsedUser.role,
              coins: parsedUser.coins
            })
          }
        } else {
          // If no data in localStorage, fetch from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setCurrentUser({
              ...user,
              role: userData.role,
              coins: userData.coins
            })
            
            // Save to localStorage
            localStorage.setItem('user', JSON.stringify({
              role: userData.role,
              coins: userData.coins
            }))
          } else {
            // If no user document found, set user without role/coins
            setCurrentUser(user)
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error)
        setCurrentUser(null)
      }
    } else {
      setCurrentUser(null)
    }
  }, []);

  useEffect(() => {
    // Set up persistent authentication listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      await updateUser(user);
      setLoading(false)
    }, (error) => {
      console.error('Authentication listener error:', error)
      setCurrentUser(null)
      setLoading(false)
    })

    // Set up token expiration listener
    const tokenListener = setInterval(async () => {
      if (currentUser) {
        try {
          await getIdToken(currentUser, true)
        } catch (error) {
          console.error('Token expired:', error)
          await logout()
        }
      }
    }, 30 * 60 * 1000) // Check every 30 minutes

    // Clean up listeners
    return () => {
      unsubscribe()
      clearInterval(tokenListener)
    }
  }, [updateUser])

  // Authentication methods
  const login = async (email: string, password: string) => {
    try {
      const user = await AuthService.login(email, password)
      console.log("AuthContext login - user after AuthService.login:", user);

      // Save data to localStorage
      localStorage.setItem('user', JSON.stringify({
        role: user.role,
        coins: user.coins
      }))

      setCurrentUser(user)
      return user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await AuthService.logout()
      localStorage.removeItem('user')
      setCurrentUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const refreshToken = async () => {
    if (!currentUser) {
      throw new Error('No authenticated user')
    }
    return TokenService.refreshToken(currentUser)
  }

  const checkTokenClaims = async () => {
    if (!currentUser) {
      throw new Error('No authenticated user')
    }
    return TokenService.checkTokenClaims(currentUser)
  }

  // Password reset function
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  // Context value
  const value = {
    currentUser,
    login,
    logout,
    refreshToken,
    checkTokenClaims,
    resetPassword,
    setCurrentUser
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext)
}
