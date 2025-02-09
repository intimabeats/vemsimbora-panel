import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter
} from 'firebase/firestore'
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser
} from 'firebase/auth'
import { UserSchema } from '../types/firestore-schema'
import { auth } from '../config/firebase'

export class UserManagementService {
  private db = getFirestore()

  // Criar novo usuário
  async createUser(userData: Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        'temporaryPassword123!' // Senha temporária
      )
      
      const user = userCredential.user

      // Atualizar perfil
      await updateProfile(user, { displayName: userData.name })

      // Dados para Firestore
      const firestoreUserData: UserSchema = {
        id: user.uid,
        ...userData,
        coins: 0,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Salvar no Firestore
      await setDoc(doc(this.db, 'users', user.uid), firestoreUserData)

      return firestoreUserData
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw error
    }
  }

  // Atualizar usuário
  async updateUser(userId: string, updates: Partial<UserSchema>) {
    try {
      const userRef = doc(this.db, 'users', userId)
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Date.now()
      })
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }

  // Excluir usuário
  async deleteUser(userId: string) {
    try {
      // Excluir do Firestore
      await deleteDoc(doc(this.db, 'users', userId))
      
      // Se o usuário estiver logado, pode precisar de reautenticação
      const currentUser = auth.currentUser
      if (currentUser && currentUser.uid === userId) {
        await deleteUser(currentUser)
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      throw error
    }
  }

  // Buscar usuários com paginação e filtros
  fetchUsers = async (options?: {
    role?: UserSchema['role']
    status?: UserSchema['status']
    limit?: number
    page?: number
  }) => {
    try {
      let q = query(collection(this.db, 'users'))

      // Filtros
      if (options?.role) {
        q = query(q, where('role', '==', options.role))
      }

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      // Ordenação
      q = query(q, orderBy('createdAt', 'desc'))

      // Executar consulta
      const snapshot = await getDocs(q)
      const allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserSchema))

      // Paginação
      const limit = options?.limit || 10
      const page = options?.page || 1
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedUsers = allUsers.slice(startIndex, endIndex)
      const totalPages = Math.ceil(allUsers.length / limit)

      return {
        data: paginatedUsers,
        totalPages,
        totalUsers: allUsers.length
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
  }

  // Enviar email de redefinição de senha
  async sendPasswordResetEmail(email: string) {
    try {
      // Implementação de envio de email de redefinição
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error)
      throw error
    }
  }
}

// Instância do serviço
export const userManagementService = new UserManagementService()
