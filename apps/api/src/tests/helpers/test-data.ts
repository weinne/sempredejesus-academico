// Temporary simplified test data helpers
// TODO: Fix schema compatibility issues from backup file

interface CreateTestUserOptions {
  email: string;
  password: string;
  role: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
}

export async function createTestUser(options: CreateTestUserOptions): Promise<string> {
  console.log('Test user creation temporarily disabled');
  return 'test-user-id';
}

export async function createTestPessoa(data: any): Promise<string> {
  console.log('Test pessoa creation temporarily disabled');  
  return 'test-pessoa-id';
}

export async function findUserByEmail(email: string): Promise<any> {
  console.log('User lookup temporarily disabled');
  return null;
}

export async function deleteUser(userId: string): Promise<void> {
  console.log('User deletion temporarily disabled');
}

export async function deletePessoa(pessoaId: string): Promise<void> {
  console.log('Pessoa deletion temporarily disabled');
}

export async function cleanup() {
  console.log('Test cleanup temporarily disabled');
} 