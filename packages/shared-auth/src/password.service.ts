import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class PasswordService {
  private readonly saltRounds: number;
  private readonly minPasswordLength: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    this.minPasswordLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10);
  }

  /**
   * Gera um hash da senha usando bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    this.validatePassword(password);
    
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Erro ao criar hash da senha');
    }
  }

  /**
   * Compara uma senha em texto plano com o hash
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Erro ao verificar senha');
    }
  }

  /**
   * Gera um salt manual (usado principalmente para testes)
   */
  async generateSalt(rounds?: number): Promise<string> {
    const saltRounds = rounds || this.saltRounds;
    try {
      return await bcrypt.genSalt(saltRounds);
    } catch (error) {
      throw new Error('Erro ao gerar salt');
    }
  }

  /**
   * Valida se a senha atende aos critérios de segurança
   */
  validatePassword(password: string): void {
    if (!password) {
      throw new Error('Senha é obrigatória');
    }

    if (password.length < this.minPasswordLength) {
      throw new Error(`Senha deve ter pelo menos ${this.minPasswordLength} caracteres`);
    }

    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      throw new Error('Senha deve conter pelo menos uma letra maiúscula');
    }

    // Verificar se contém pelo menos uma letra minúscula  
    if (!/[a-z]/.test(password)) {
      throw new Error('Senha deve conter pelo menos uma letra minúscula');
    }

    // Verificar se contém pelo menos um número
    if (!/\d/.test(password)) {
      throw new Error('Senha deve conter pelo menos um número');
    }

    // Verificar se contém pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Senha deve conter pelo menos um caractere especial');
    }

    // Verificar senhas comuns/fracas
    const commonPasswords = [
      '12345678', 'password', 'password123', '123456789', 'qwerty123',
      'admin123', 'senha123', '12345678', 'Password1', 'Admin123',
      'seminario123', 'jesus123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error('Esta senha é muito comum. Escolha uma senha mais segura.');
    }
  }

  /**
   * Gera uma senha temporária segura
   */
  generateTemporaryPassword(length = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos um de cada tipo de caractere
    password += this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); // Maiúscula
    password += this.getRandomChar('abcdefghijklmnopqrstuvwxyz'); // Minúscula  
    password += this.getRandomChar('0123456789'); // Número
    password += this.getRandomChar('!@#$%^&*'); // Especial
    
    // Preencher o resto com caracteres aleatórios
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(crypto.randomInt(0, charset.length));
    }
    
    // Embaralhar a senha para não ter padrão previsível
    return this.shuffleString(password);
  }

  /**
   * Verifica a força da senha (0-4)
   */
  getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Comprimento
    if (password.length >= 8) score++;
    else feedback.push('Use pelo menos 8 caracteres');

    if (password.length >= 12) score++;
    else if (password.length >= 8) feedback.push('Considere usar 12+ caracteres');

    // Complexidade
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Adicione letras maiúsculas');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Adicione letras minúsculas');

    if (/\d/.test(password)) score++;
    else feedback.push('Adicione números');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else feedback.push('Adicione caracteres especiais');

    // Penalidades
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Evite repetir caracteres consecutivos');
    }

    // Normalizar score para 0-4
    score = Math.min(4, score);

    return { score, feedback };
  }

  /**
   * Gera um token seguro para reset de senha ou verificação
   */
  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verifica se duas senhas são iguais (timing-safe)
   */
  constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Métodos auxiliares privados
   */
  private getRandomChar(charset: string): string {
    return charset.charAt(crypto.randomInt(0, charset.length));
  }

  private shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
}

// Export singleton instance
export const passwordService = new PasswordService(); 