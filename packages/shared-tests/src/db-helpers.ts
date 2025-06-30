export class DbTestHelper {
  static async clearAllTables() {
    // Helper para limpar todas as tabelas do banco de teste
    // Será implementado quando o Drizzle estiver configurado
  }

  static async seedBasicData() {
    // Helper para popular dados básicos necessários para testes
    // Será implementado quando o Drizzle estiver configurado
  }

  static generateTestData() {
    return {
      pessoa: {
        nomeCompleto: 'João da Silva Teste',
        sexo: 'M' as const,
        email: 'joao.teste@email.com',
        cpf: '12345678901',
        dataNasc: '1990-01-01',
        telefone: '11999999999',
      },
      curso: {
        nome: 'Teologia',
        grau: 'Bacharel',
      },
      disciplina: {
        codigo: 'TEO001',
        nome: 'Introdução à Teologia',
        creditos: 4,
        cargaHoraria: 60,
        ementa: 'Conceitos básicos de teologia',
      },
    };
  }

  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // Helper para executar código dentro de uma transação de teste
    // Será implementado quando o Drizzle estiver configurado
    return callback();
  }
} 