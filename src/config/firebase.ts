import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore'
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU0TCTTobySafDi-9Y68C5eyOD-gmU7nw",
  authDomain: "vem-simbora.firebaseapp.com",
  projectId: "vem-simbora",
  storageBucket: "vem-simbora.firebasestorage.app",
  messagingSenderId: "403932059706",
  appId: "1:403932059706:web:5a7e01eebf7be71769bd03",
  measurementId: "G-31XN454YCP"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Extended user interface
interface ExtendedUser extends User {
  role?: 'admin' | 'manager' | 'employee'
  coins?: number
}

// Session management service
export const SessionService = {
  // Persistir sessão no localStorage
  persistSession: async (user: ExtendedUser) => {
    try {
      // Obter token de ID
      const tokenResult = await getIdTokenResult(user)
      
      // Salvar informações no localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        coins: user.coins,
        tokenExpirationTime: tokenResult.expirationTime
      }))
    } catch (error) {
      console.error('Erro ao persistir sessão:', error)
    }
  },

  // Recuperar sessão do localStorage
  restoreSession: async (): Promise<ExtendedUser | null> => {
    const storedUser = localStorage.getItem('user')
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      
      // Verificar validade do token
      if (parsedUser.tokenExpirationTime) {
        const expirationTime = new Date(parsedUser.tokenExpirationTime).getTime()
        const currentTime = new Date().getTime()
        
        if (currentTime < expirationTime) {
          return parsedUser
        }
      }
    }
    
    return null
  },

  // Limpar sessão
  clearSession: () => {
    localStorage.removeItem('user')
  },

  // Validar token
  validateToken: async (user: User): Promise<boolean> => {
    try {
      const tokenResult = await getIdTokenResult(user)
      const currentTime = new Date().getTime()
      const expirationTime = new Date(tokenResult.expirationTime).getTime()
      
      return currentTime < expirationTime
    } catch (error) {
      console.error('Erro ao validar token:', error)
      return false
    }
  }
}

// Token refresh service
export const TokenService = {
  // Atualizar token manualmente
  refreshToken: async (user: User): Promise<string> => {
    try {
      return await getIdToken(user, true)
    } catch (error) {
      console.error('Erro ao atualizar token:', error)
      throw error
    }
  },

  // Verificar permissões do token
  checkTokenClaims: async (user: User) => {
    try {
      const tokenResult = await getIdTokenResult(user)
      return {
        admin: tokenResult.claims.admin === true,
        manager: tokenResult.claims.manager === true,
        employee: tokenResult.claims.employee === true
      }
    } catch (error) {
      console.error('Erro ao verificar claims do token:', error)
      return {
        admin: false,
        manager: false,
        employee: false
      }
    }
  }
}

// Authentication service
export const AuthService = {
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Buscar dados adicionais do usuário
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        // Persistir sessão
        await SessionService.persistSession({
          ...user,
          role: userData.role,
          coins: userData.coins
        })
        
        return {
          ...user,
          role: userData.role,
          coins: userData.coins
        }
      }
      
      throw new Error('Dados do usuário não encontrados')
    } catch (error) {
      console.error('Erro de login:', error)
      throw error
    }
  },

  logout: async () => {
    try {
      await signOut(auth)
      SessionService.clearSession()
    } catch (error) {
      console.error('Erro de logout:', error)
      throw error
    }
  }
}

export { auth, db, storage }
