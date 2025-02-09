import { 
  getAuth, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth'

export const SecurityUtils = {
  // Validar força da senha
  validatePasswordStrength: (password: string): boolean => {
    // Requisitos:
    // - Mínimo 8 caracteres
    // - Pelo menos uma letra maiúscula
    // - Pelo menos uma letra minúscula
    // - Pelo menos um número
    // - Pelo menos um caractere especial
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  },

  // Reautenticar usuário antes de ações sensíveis
  reauthenticateUser: async (email: string, password: string) => {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user || !user.email) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const credential = EmailAuthProvider.credential(email, password)
      await reauthenticateWithCredential(user, credential)
      return true
    } catch (error) {
      console.error('Erro de reautenticação:', error)
      throw error
    }
  },

  // Gerar código de verificação
  generateVerificationCode: (length: number = 6): string => {
    return Array.from(
      { length }, 
      () => Math.floor(Math.random() * 10)
    ).join('')
  },

  // Verificar atividades suspeitas
  detectSuspiciousActivity: (
    loginAttempts: number, 
    lastLoginTime: number
  ): boolean => {
    const MAX_ATTEMPTS = 5
    const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos

    const timeSinceLastLogin = Date.now() - lastLoginTime

    return (
      loginAttempts >= MAX_ATTEMPTS && 
      timeSinceLastLogin < LOCKOUT_DURATION
    )
  },

  // Máscarar informações sensíveis
  maskSensitiveData: {
    email: (email: string) => {
      if (!email) return ''
      const [username, domain] = email.split('@')
      return `${username.slice(0, 2)}****@${domain}`
    },
    
    cpf: (cpf: string) => {
      if (!cpf) return ''
      return `***${cpf.slice(-4)}`
    }
  }
}

// Middleware de segurança para ações críticas
export const SecurityMiddleware = {
  async protectAction<T>(
    action: () => Promise<T>, 
    options?: {
      requireReauth?: boolean
      requiredRole?: 'admin' | 'manager' | 'employee'
    }
  ): Promise<T> {
    const auth = getAuth()
    const user = auth.currentUser

    // Verificar autenticação
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Verificar role, se necessário
    if (options?.requiredRole) {
      // Lógica de verificação de role
      // Pode ser implementada com custom claims ou verificação no Firestore
    }

    // Reautenticação, se necessário
    if (options?.requireReauth) {
      // Lógica de reautenticação
      // Pode solicitar senha novamente
    }

    // Executar ação protegida
    return action()
  }
}
