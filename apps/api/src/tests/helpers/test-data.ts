import { db } from '../../db';
import { users, pessoas } from '../../db/schema';
import { passwordService } from '@seminario/shared-auth';
import { eq } from 'drizzle-orm';
import { UserRole } from '@seminario/shared-auth';

interface CreateTestUserOptions {
  email: string;
  password: string;
  role: keyof typeof UserRole;
  nome?: string;
  cpf?: string;
  telefone?: string;
}

export async function createTestUser(options: CreateTestUserOptions): Promise<string> {
  const {
    email,
    password,
    role,
    nome = 'Test User',
    cpf = '12345678901',
    telefone = '11999999999',
  } = options;

  try {
    // First create a person record
    const [pessoa] = await db.insert(pessoas).values({
      nome,
      email,
      cpf,
      telefone,
      endereco: 'Test Address',
      dataNascimento: new Date('1990-01-01'),
    }).returning();

    // Hash the password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create user record
    const [user] = await db.insert(users).values({
      email,
      senha: hashedPassword,
      role: role as UserRole,
      pessoaId: pessoa.id,
      ativo: true,
    }).returning();

    return user.id;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

export async function createTestPerson(data: Partial<typeof pessoas.$inferInsert> = {}): Promise<string> {
  const defaultData = {
    nome: 'Test Person',
    email: 'test.person@example.com',
    cpf: '98765432100',
    telefone: '11888888888',
    endereco: 'Test Address',
    dataNascimento: new Date('1985-01-01'),
    ...data,
  };

  try {
    const [pessoa] = await db.insert(pessoas).values(defaultData).returning();
    return pessoa.id;
  } catch (error) {
    console.error('Error creating test person:', error);
    throw error;
  }
}

export async function getTestUser(email: string) {
  try {
    const result = await db
      .select({
        user: users,
        pessoa: pessoas,
      })
      .from(users)
      .innerJoin(pessoas, eq(users.pessoaId, pessoas.id))
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting test user:', error);
    return null;
  }
}

export async function deleteTestUser(userId: string): Promise<void> {
  try {
    // Get user to find associated person
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length > 0) {
      const pessoaId = user[0].pessoaId;

      // Delete user first (foreign key constraint)
      await db.delete(users).where(eq(users.id, userId));

      // Delete associated person
      if (pessoaId) {
        await db.delete(pessoas).where(eq(pessoas.id, pessoaId));
      }
    }
  } catch (error) {
    console.error('Error deleting test user:', error);
    // Don't throw here, as this is cleanup
  }
}

export async function deleteTestPerson(pessoaId: string): Promise<void> {
  try {
    await db.delete(pessoas).where(eq(pessoas.id, pessoaId));
  } catch (error) {
    console.error('Error deleting test person:', error);
    // Don't throw here, as this is cleanup
  }
}

export async function cleanupTestData(): Promise<void> {
  try {
    // Delete all test users (emails containing 'test' or ending with 'seminario.edu')
    const testUsers = await db
      .select()
      .from(users)
      .where(
        // This is a simplified cleanup - in real tests you'd want more specific criteria
        eq(users.email, 'test@seminario.edu')
      );

    for (const user of testUsers) {
      await deleteTestUser(user.id);
    }

    // Clean up any orphaned test persons
    const testPersons = await db
      .select()
      .from(pessoas)
      .where(
        // Clean up persons with test emails
        eq(pessoas.email, 'test.person@example.com')
      );

    for (const pessoa of testPersons) {
      await deleteTestPerson(pessoa.id);
    }

    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error during test data cleanup:', error);
    // Don't throw here, as this is cleanup
  }
}

export async function resetTestDatabase(): Promise<void> {
  try {
    // In a real implementation, this would:
    // 1. Truncate all tables
    // 2. Reset sequences
    // 3. Re-seed with minimal required data
    
    await cleanupTestData();
    console.log('Test database reset completed');
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
}

// Helper to create test data for specific scenarios
export const testDataFactory = {
  async createAdminUser() {
    return createTestUser({
      email: 'admin@seminario.edu',
      password: 'AdminPassword123!',
      role: 'ADMIN',
      nome: 'Test Admin',
    });
  },

  async createProfessorUser() {
    return createTestUser({
      email: 'professor@seminario.edu',
      password: 'ProfessorPassword123!',
      role: 'PROFESSOR',
      nome: 'Test Professor',
    });
  },

  async createSecretariaUser() {
    return createTestUser({
      email: 'secretaria@seminario.edu',
      password: 'SecretariaPassword123!',
      role: 'SECRETARIA',
      nome: 'Test Secretaria',
    });
  },

  async createAlunoUser() {
    return createTestUser({
      email: 'aluno@seminario.edu',
      password: 'AlunoPassword123!',
      role: 'ALUNO',
      nome: 'Test Aluno',
    });
  },
}; 