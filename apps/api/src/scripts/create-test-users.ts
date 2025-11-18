import { eq } from 'drizzle-orm';
import { db } from '../db';
import { pessoas, users } from '../db/schema';

async function createTestUsers() {
  try {
    console.log('🔧 Creating test users with different roles...');

    // Helper function to create user
    async function createUser(
      nome: string, 
      email: string, 
      username: string, 
      role: 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'ALUNO',
      cpf: string
    ) {
      console.log(`\n📝 Creating ${role}: ${email}`);
      
      // Check if pessoa already exists
      const existingPessoa = await db
        .select()
        .from(pessoas)
        .where(eq(pessoas.email, email))
        .limit(1);

      let pessoaId;

      if (existingPessoa.length > 0) {
        console.log(`  ✅ Pessoa already exists`);
        pessoaId = existingPessoa[0].id;
      } else {
        // Create pessoa
        const [newPessoa] = await db
          .insert(pessoas)
          .values({
            nomeCompleto: nome,
            sexo: 'M',
            email: email,
            cpf: cpf,
            telefone: '(11) 99999-9999',
          })
          .returning();
        
        console.log(`  ✅ Pessoa created with ID: ${newPessoa.id}`);
        pessoaId = newPessoa.id;
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.pessoaId, pessoaId))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`  ✅ User already exists`);
        return;
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 12);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          pessoaId: pessoaId,
          username: username,
          passwordHash: hashedPassword,
          role: role,
          isActive: 'S',
        })
        .returning();

      console.log(`  ✅ User created with ID: ${newUser.id}`);
    }

    // Create test users
    await createUser(
      'Secretário do Sistema', 
      'secretaria@seminario.edu', 
      'secretaria',
      'SECRETARIA',
      '11111111111'
    );

    await createUser(
      'Professor João Silva', 
      'professor@seminario.edu', 
      'professor',
      'PROFESSOR',
      '22222222222'
    );

    await createUser(
      'Aluno Pedro Santos', 
      'aluno@seminario.edu', 
      'aluno',
      'ALUNO',
      '33333333333'
    );

    console.log('\n🎉 Test users created successfully!');
    console.log('📧 Credentials:');
    console.log('   ADMIN: admin@seminario.edu / admin123');
    console.log('   SECRETARIA: secretaria@seminario.edu / test123');
    console.log('   PROFESSOR: professor@seminario.edu / test123');
    console.log('   ALUNO: aluno@seminario.edu / test123');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestUsers(); 