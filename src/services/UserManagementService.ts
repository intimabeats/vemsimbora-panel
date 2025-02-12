import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
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
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth'
import { UserSchema } from '../types/firestore-schema'
import { auth, storage } from '../config/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export class UserManagementService {
  private db = getFirestore()
  private auth = getAuth()

  // Criar novo usuário
  async createUser(
    userData: Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt' | 'coins'>,
    password: string // Accept password as a separate argument
  ): Promise<UserSchema> {
    try {
      // Criar usuário no Firebase Authentication
      if (!password) {
        throw new Error("Password is required");
      }
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        password // Use the password argument
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
    // ... (rest of the methods remain unchanged)
      // Atualizar usuário
  async updateUser(
    userId: string,
    updates: Partial<UserSchema>,
    profileImage?: File
  ): Promise<UserSchema> {
    try {
      const userRef = doc(this.db, 'users', userId)

      // Upload de imagem de perfil, se fornecida
      if (profileImage) {
        const storageRef = ref(storage, `users/${userId}/profile_image`)
        await uploadBytes(storageRef, profileImage)
        const photoURL = await getDownloadURL(storageRef)
        updates.profileImage = photoURL
      }

      // Atualizar usuário no Firestore
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Date.now()
      })

      // Buscar usuário atualizado
      const updatedDoc = await getDoc(userRef)
      return { id: updatedDoc.id, ...updatedDoc.data() } as UserSchema
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
      const currentUser = this.auth.currentUser
      if (currentUser && currentUser.uid === userId) {
        await deleteUser(currentUser)
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      throw error
    }
  }

  // Buscar usuários com paginação e filtros
  async fetchUsers(options?: {
    role?: UserSchema['role']
    status?: UserSchema['status']
    limit?: number
    page?: number
    searchTerm?: string
  }): Promise<{
    data: UserSchema[];
    totalPages: number;
    totalUsers: number
  }> {
    try {
      let q = query(collection(this.db, 'users'))

      // Filtros
      if (options?.role) {
        q = query(q, where('role', '==', options.role))
      }

      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      // Filtro de busca
      if (options?.searchTerm) {
        const searchTerm = options.searchTerm.toLowerCase()
        q = query(
          q,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff')
        )
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

  // Buscar usuário por ID
  async getUserById(userId: string): Promise<UserSchema> {
    try {
      const userRef = doc(this.db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return {
          id: userSnap.id,
          ...userSnap.data()
        } as UserSchema
      } else {
        throw new Error('Usuário não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error)
      throw error
    }
  }

  // Enviar email de redefinição de senha
  async sendPasswordResetEmail(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error)
      throw error
    }
  }

  // Gerenciar moedas do usuário
  async updateUserCoins(
    userId: string,
    coinsToAdd: number
  ): Promise<number> {
    try {
      const userRef = doc(this.db, 'users', userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado')
      }

      const currentCoins = userDoc.data().coins || 0
      const newCoinBalance = currentCoins + coinsToAdd

      await updateDoc(userRef, {
        coins: newCoinBalance,
        updatedAt: Date.now()
      })

      return newCoinBalance
    } catch (error) {
      console.error('Erro ao atualizar moedas:', error)
      throw error
    }
  }

  // Registrar histórico de transações de moedas
  async logCoinTransaction(
    userId: string,
    amount: number,
    description: string
  ) {
    try {
      const transactionRef = doc(collection(this.db, 'users', userId, 'coin_transactions'))

      await setDoc(transactionRef, {
        amount,
        description,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Erro ao registrar transação de moedas:', error)
      throw error
    }
  }
}

export const userManagementService = new UserManagementService()
