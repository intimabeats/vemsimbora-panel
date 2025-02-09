import React, { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Save, 
  Camera,
  X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthService } from '../config/firebase'
import { useNavigate } from 'react-router-dom' // Importar useNavigate

export const Profile: React.FC = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate() // Usar useNavigate
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || '')
      setEmail(currentUser.email || '')
      setProfileImage(currentUser.photoURL)
    }
  }, [currentUser])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validatePasswords = () => {
    if (newPassword !== confirmPassword) {
      setError('Novas senhas não coincidem')
      return false
    }
    if (newPassword && newPassword.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres')
      return false
    }
    return true
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Validar senhas se estiverem sendo alteradas
      if (newPassword) {
        if (!validatePasswords()) {
          setIsLoading(false)
          return
        }
      }

      // Atualizar perfil
      await AuthService.updateProfile(currentUser!.uid, {
        name,
        email
      })

      // Atualizar senha se fornecida
      if (newPassword) {
        // Lógica para atualizar senha
        // Nota: Isso geralmente requer reauthenticação
      }

      setSuccess('Perfil atualizado com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil')
    } finally {
      setIsLoading(false)
    }
  }

    const handleClose = () => {
        // Determinar a rota de retorno com base na role do usuário
        const returnRoute = currentUser?.role === 'admin'
          ? '/admin/settings'
          : currentUser?.role === 'manager'
          ? '/manager/settings'
          : '/employee/settings'; // Rota padrão, ajuste conforme necessário

        navigate(returnRoute);
    };

  return (
    <div className="p-8 bg-gray-50">
      <div className="space-y-8">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
          <button
            onClick={handleClose} // Usar a função handleClose
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Informações Pessoais */}
          <div className="md:col-span-2 bg-white p-8 rounded-xl shadow-md">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2 flex items-center">
                    <User className="mr-2 text-gray-500" size={20} /> Nome
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 flex items-center">
                    <Mail className="mr-2 text-gray-500" size={20} /> Email
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2 flex items-center">
                    <Lock className="mr-2 text-gray-500" size={20} /> Senha Atual
                  </label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Deixe em branco se não quiser alterar"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 flex items-center">
                    <Shield className="mr-2 text-gray-500" size={20} /> Nova Senha
                  </label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 flex items-center">
                  <Shield className="mr-2 text-gray-500" size={20} /> Confirmar Nova Senha
                </label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : (
                  <>
                    <Save className="mr-2" /> Salvar Alterações
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Foto de Perfil */}
          <div className="bg-white p-8 rounded-xl shadow-md flex flex-col items-center">
            <div className="relative mb-6">
              <img 
                src={profileImage || 'https://via.placeholder.com/150'}
                alt="Foto de Perfil" 
                className="w-48 h-48 rounded-full object-cover border-4 border-blue-100"
              />
              <label 
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
              >
                <Camera size={20} />
                <input 
                  type="file" 
                  id="profile-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
              <p className="text-gray-600">{currentUser?.role}</p>
              <p className="text-sm text-gray-500 mt-2">{email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
