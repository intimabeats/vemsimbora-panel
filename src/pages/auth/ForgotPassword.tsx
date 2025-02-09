import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await resetPassword(email)
      setSuccess('Link de redefinição de senha enviado. Verifique seu email.')
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'Nenhum usuário encontrado com este email',
      'auth/invalid-email': 'Email inválido',
      'default': 'Erro ao redefinir senha. Tente novamente.'
    }
    return errorMessages[errorCode] || errorMessages['default']
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 border border-gray-100">
        <div className="text-center mb-8">
          <Lock className="mx-auto mb-4 text-blue-600" size={48} />
          <h1 className="text-2xl font-bold text-gray-800">Redefinir Senha</h1>
          <p className="text-gray-500">Digite seu email para recuperação</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <CheckCircle className="mr-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email" 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <span>Enviando...</span>
            ) : (
              <>
                <Send className="mr-2" /> Enviar Link de Recuperação
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <a 
            href="/login" 
            className="text-blue-600 hover:underline"
          >
            Voltar para Login
          </a>
        </div>
      </div>
    </div>
  )
}
