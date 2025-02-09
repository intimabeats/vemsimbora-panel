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
  limit
} from 'firebase/firestore'
import { auth } from '../config/firebase'
import { ProjectSchema } from '../types/firestore-schema'

export class ProjectService {
  private db = getFirestore()

  // Criar novo projeto
  async createProject(projectData: Omit<ProjectSchema, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const projectRef = doc(collection(this.db, 'projects'))
      
      const newProject: ProjectSchema = {
        id: projectRef.id,
        ...projectData,
        createdBy: auth.currentUser?.uid || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      await setDoc(projectRef, newProject)
      return newProject
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      throw error
    }
  }

  // Atualizar projeto
  async updateProject(projectId: string, updates: Partial<ProjectSchema>) {
    try {
      const projectRef = doc(this.db, 'projects', projectId)
      
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: Date.now()
      })
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error)
      throw error
    }
  }

  // Excluir projeto
  async deleteProject(projectId: string) {
    try {
      const projectRef = doc(this.db, 'projects', projectId)
      await deleteDoc(projectRef)
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
      throw error
    }
  }

  // Buscar projetos com paginação e filtros
  async fetchProjects(options?: {
    status?: ProjectSchema['status']
    limit?: number
    page?: number
  }) {
    try {
      let q = query(collection(this.db, 'projects'))

      // Filtros
      if (options?.status) {
        q = query(q, where('status', '==', options.status))
      }

      // Ordenação
      q = query(q, orderBy('createdAt', 'desc'))

      // Executar consulta
      const snapshot = await getDocs(q)
      const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProjectSchema))

      // Paginação
      const limit = options?.limit || 10
      const page = options?.page || 1
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedProjects = allProjects.slice(startIndex, endIndex)
      const totalPages = Math.ceil(allProjects.length / limit)

      return {
        data: paginatedProjects,
        totalPages,
        totalProjects: allProjects.length
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
      throw error
    }
  }

  // Buscar projeto por ID
  async getProjectById(projectId: string) {
    try {
      const projectRef = doc(this.db, 'projects', projectId)
      const projectSnap = await getDoc(projectRef)

      if (projectSnap.exists()) {
        return {
          id: projectSnap.id,
          ...projectSnap.data()
        } as ProjectSchema
      } else {
        throw new Error('Projeto não encontrado')
      }
    } catch (error) {
      console.error('Erro ao buscar projeto:', error)
      throw error
    }
  }
}

export const projectService = new ProjectService()
