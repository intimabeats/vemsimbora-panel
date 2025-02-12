import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { UserSchema } from '../../types/firestore-schema'
import { userManagementService } from '../../services/UserManagementService'
import { CreateUserModal } from '../../components/modals/CreateUserModal'
import { EditUserModal } from '../../components/modals/EditUserModal'
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal'

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserSchema[]>([])
  const [isLoading, setLoading] = useState(true); // Add loading state
  const [filter, setFilter] = useState<{
    role?: UserSchema['role']
    status?: UserSchema['status']
  }>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSchema | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [filter, currentPage])

  const fetchUsers = async () => {
    try {
      setLoading(true); // Set loading to true before fetching
      const fetchedUsers = await userManagementService.fetchUsers({
        role: filter.role,
        status: filter.status,
        limit: itemsPerPage,
        page: currentPage
      })

      setUsers(fetchedUsers.data)
      setTotalPages(fetchedUsers.totalPages)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false); // Set loading to false after fetching (both success and error)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await userManagementService.deleteUser(selectedUser.id)

      // Atualizar lista de usuários
      setUsers(prevUsers =>
        prevUsers.filter(user => user.id !== selectedUser.id)
      )

      // Resetar seleção e fechar modal
      setSelectedUser(null)
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
    }
  }

  const handleEditUser = (user: UserSchema) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteConfirmation = (user: UserSchema) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleUserCreated = (newUser: UserSchema) => {
    setUsers(prevUsers => [newUser, ...prevUsers])
  }

  const handleUserUpdated = (updatedUser: UserSchema) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    )
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const RoleBadge: React.FC<{ role: UserSchema['role'] }> = ({ role }) => {
    const roleStyles = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${roleStyles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  return (
    <Layout role="admin" isLoading={isLoading}>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <Users className="mr-4 text-blue-600" /> Gerenciamento de Usuários
            </h1>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
            >
              <Plus className="mr-2" /> Adicionar Usuário
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>

            <select
              value={filter.role || ''}
              onChange={(e) => setFilter({
                ...filter,
                role: e.target.value as UserSchema['role']
              })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos os Cargos</option>
              <option value="admin">Administradores</option>
              <option value="manager">Gestores</option>
              <option value="employee">Funcionários</option>
            </select>

            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({
                ...filter,
                status: e.target.value as UserSchema['status']
              })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="suspended">Suspensos</option>
            </select>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2 py-1 rounded-full text-xs
                          ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'}
                        `}>
                          {user.status === 'active' ? 'Ativo' :
                            user.status === 'inactive' ? 'Inativo' :
                              'Suspenso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirmation(user)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
              >
                <ChevronLeft className="mr-2" /> Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
              >
                Próximo <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>

          {/* Modais */}
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onUserCreated={handleUserCreated}
          />

          {selectedUser && (
            <>
              <EditUserModal
                user={selectedUser}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUserUpdated={handleUserUpdated}
              />

              <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteUser}
                itemName={selectedUser.name}
                warningMessage="A exclusão de um usuário removerá permanentemente todas as suas informações do sistema."
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
