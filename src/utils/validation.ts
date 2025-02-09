// Validações reutilizáveis

export const Validation = {
  // Validação de email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validação de senha
  isStrongPassword: (password: string): boolean => {
    // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    return passwordRegex.test(password)
  },

  // Validação de nome
  isValidName: (name: string): boolean => {
    // Nome com pelo menos duas palavras
    const nameRegex = /^[A-Za-zÀ-ÿ]+\s[A-Za-zÀ-ÿ]+/
    return nameRegex.test(name)
  },

  // Validação de CPF (opcional, pode ser adaptado conforme necessário)
  isValidCPF: (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false

    // Validação de CPF com algoritmo de verificação
    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i-1, i)) * (11 - i)
    }
    
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i-1, i)) * (12 - i)
    }
    
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.substring(10, 11))) return false

    return true
  }
}
