import { eq } from 'drizzle-orm';
import { db } from '../db';
import { pessoas, users } from '../db/schema';
import { passwordService } from '@seminario/shared-auth';

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Step 1: Check if admin already exists in pessoas table
    const existingAdmin = await db
      .select()
      .from(pessoas)
      .where(eq(pessoas.email, 'admin@seminario.edu'))
      .limit(1);

    let adminPessoa;

    if (existingAdmin.length > 0) {
      console.log('✅ Admin pessoa already exists');
      adminPessoa = existingAdmin[0];
    } else {
      // Step 2: Create pessoa (personal data)
      console.log('📝 Creating pessoa record...');
      const [newPessoa] = await db
        .insert(pessoas)
        .values({
          nomeCompleto: 'Administrador do Sistema',
          sexo: 'M',
          email: 'admin@seminario.edu',
          cpf: '00000000001', // Admin CPF
          telefone: '(11) 99999-9999',
        })
        .returning();

      console.log(`✅ Pessoa created with ID: ${newPessoa.id}`);
      adminPessoa = newPessoa;
    }

    // Step 3: Check if user record exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.pessoaId, adminPessoa.id))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Admin user already exists!');
      console.log('Email: admin@seminario.edu');
      console.log('Password: admin123');
      return;
    }

    // Step 4: Hash password - using a simple password for development
    console.log('🔐 Hashing password...');
    // Bypass validation for development by using direct bcrypt
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Step 5: Create user (login credentials)
    console.log('👤 Creating user record...');
    const [newUser] = await db
      .insert(users)
      .values({
        pessoaId: adminPessoa.id,
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: 'S',
      })
      .returning();

    console.log(`✅ User created with ID: ${newUser.id}`);

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email: admin@seminario.edu');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: ADMIN');
    console.log('\nYou can now login at: POST /api/auth/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createAdminUser(); 