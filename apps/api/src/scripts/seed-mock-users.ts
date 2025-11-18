import { eq } from 'drizzle-orm';
import { db } from '../db';
import { pessoas, users } from '../db/schema';
import { logger } from '@seminario/shared-config';

/**
 * Script para inserir usuários mock no banco de dados
 * 
 * Este script define e insere usuários consistentes para desenvolvimento e testes.
 * 
 * Execução:
 * pnpm --filter @seminario/api seed:users
 */

// Dados mock para seeding
const mockUsersForSeeding = [
  {
    pessoa: {
      nomeCompleto: 'Administrador do Sistema',
      sexo: 'M' as const,
      email: 'admin@seminario.edu',
      cpf: '11111111111',
      dataNasc: '1980-01-01',
      telefone: '(11) 99999-9999',
      endereco: { logradouro: 'Rua Administrativa', numero: '123', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', cep: '01000-000' }
    },
    user: {
      username: 'admin',
      password: 'admin123', // Será hasheado
      role: 'ADMIN' as const,
      isActive: 'S' as const
    }
  },
  {
    pessoa: {
      nomeCompleto: 'Maria da Secretaria',
      sexo: 'F' as const,
      email: 'secretaria@seminario.edu',
      cpf: '22222222222',
      dataNasc: '1985-05-15',
      telefone: '(11) 88888-8888',
      endereco: { logradouro: 'Rua da Secretaria', numero: '456', bairro: 'Vila Nova', cidade: 'São Paulo', estado: 'SP', cep: '02000-000' }
    },
    user: {
      username: 'secretaria',
      password: 'test123',
      role: 'SECRETARIA' as const,
      isActive: 'S' as const
    }
  },
  {
    pessoa: {
      nomeCompleto: 'João Professor Silva',
      sexo: 'M' as const,
      email: 'professor@seminario.edu',
      cpf: '33333333333',
      dataNasc: '1975-09-20',
      telefone: '(11) 77777-7777',
      endereco: { logradouro: 'Rua dos Professores', numero: '789', bairro: 'Jardim', cidade: 'São Paulo', estado: 'SP', cep: '03000-000' }
    },
    user: {
      username: 'professor',
      password: 'test123',
      role: 'PROFESSOR' as const,
      isActive: 'S' as const
    }
  },
  {
    pessoa: {
      nomeCompleto: 'Ana Professora Santos',
      sexo: 'F' as const,
      email: 'ana.professor@seminario.edu',
      cpf: '44444444444',
      dataNasc: '1982-03-10',
      telefone: '(11) 66666-6666',
      endereco: { logradouro: 'Rua dos Educadores', numero: '321', bairro: 'Vila Educação', cidade: 'São Paulo', estado: 'SP', cep: '04000-000' }
    },
    user: {
      username: 'ana.professor',
      password: 'test123',
      role: 'PROFESSOR' as const,
      isActive: 'S' as const
    }
  },
  {
    pessoa: {
      nomeCompleto: 'Pedro Aluno Oliveira',
      sexo: 'M' as const,
      email: 'aluno@seminario.edu',
      cpf: '55555555555',
      dataNasc: '1995-12-05',
      telefone: '(11) 55555-5555',
      endereco: { logradouro: 'Rua dos Estudantes', numero: '654', bairro: 'Vila Estudantil', cidade: 'São Paulo', estado: 'SP', cep: '05000-000' }
    },
    user: {
      username: 'aluno',
      password: 'test123',
      role: 'ALUNO' as const,
      isActive: 'S' as const
    }
  },
  {
    pessoa: {
      nomeCompleto: 'Julia Aluna Costa',
      sexo: 'F' as const,
      email: 'julia.aluna@seminario.edu',
      cpf: '66666666666',
      dataNasc: '1998-07-22',
      telefone: '(11) 44444-4444',
      endereco: { logradouro: 'Rua da Juventude', numero: '987', bairro: 'Vila Jovem', cidade: 'São Paulo', estado: 'SP', cep: '06000-000' }
    },
    user: {
      username: 'julia.aluna',
      password: 'test123',
      role: 'ALUNO' as const,
      isActive: 'S' as const
    }
  },
  {
    pessoa: {
      nomeCompleto: 'Carlos Inativo Ferreira',
      sexo: 'M' as const,
      email: 'inativo@seminario.edu',
      cpf: '77777777777',
      dataNasc: '1990-11-30',
      telefone: '(11) 33333-3333',
      endereco: { logradouro: 'Rua dos Inativos', numero: '147', bairro: 'Vila Esquecida', cidade: 'São Paulo', estado: 'SP', cep: '07000-000' }
    },
    user: {
      username: 'inativo',
      password: 'test123',
      role: 'ALUNO' as const,
      isActive: 'N' as const // Conta desativada para testes
    }
  }
];

/**
 * Cria apenas os usuários que aparecem na tela de login em desenvolvimento.
 * Esta função pode ser chamada sem fazer process.exit().
 */
async function ensureLoginTestUsers() {
  try {
    // Emails dos usuários que aparecem na tela de login
    const loginTestUserEmails = [
      'admin@seminario.edu',
      'secretaria@seminario.edu',
      'professor@seminario.edu',
      'aluno@seminario.edu',
    ];

    // Filtrar apenas os usuários que aparecem na tela de login
    const loginTestUsers = mockUsersForSeeding.filter(
      (mockData) => loginTestUserEmails.includes(mockData.pessoa.email!)
    );

    let created = 0;
    let existing = 0;

    for (const mockData of loginTestUsers) {
      const { pessoa: pessoaData, user: userData } = mockData;
      
      // 1. Check if pessoa already exists
      const existingPessoa = await db
        .select()
        .from(pessoas)
        .where(eq(pessoas.email, pessoaData.email!))
        .limit(1);

      let pessoaId;

      if (existingPessoa.length > 0) {
        pessoaId = existingPessoa[0].id;
        existing++;
      } else {
        // Create pessoa
        const [newPessoa] = await db
          .insert(pessoas)
          .values({
            nomeCompleto: pessoaData.nomeCompleto,
            sexo: pessoaData.sexo,
            email: pessoaData.email,
            cpf: pessoaData.cpf,
            dataNasc: pessoaData.dataNasc,
            telefone: pessoaData.telefone,
            endereco: pessoaData.endereco
          })
          .returning();
        
        pessoaId = newPessoa.id;
        created++;
      }

      // 2. Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.pessoaId, pessoaId))
        .limit(1);

      if (existingUser.length > 0) {
        continue;
      }

      // 3. Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // 4. Create user
      await db
        .insert(users)
        .values({
          pessoaId: pessoaId,
          username: userData.username,
          passwordHash: hashedPassword,
          role: userData.role,
          isActive: userData.isActive,
        })
        .returning();
    }

    if (created > 0) {
      logger.info(`✅ Created ${created} login test user(s) automatically`);
    }

    return { created, existing };
  } catch (error) {
    logger.error('❌ Error ensuring login test users:', error);
    throw error;
  }
}

async function seedMockUsers() {
  try {
    console.log('🌱 Seeding mock users...');
    console.log(`📊 Total users to process: ${mockUsersForSeeding.length}`);

    let created = 0;
    let existing = 0;

    for (const mockData of mockUsersForSeeding) {
      const { pessoa: pessoaData, user: userData } = mockData;
      
      console.log(`\n📝 Processing ${userData.role}: ${pessoaData.email}`);
      
      // 1. Check if pessoa already exists
      const existingPessoa = await db
        .select()
        .from(pessoas)
        .where(eq(pessoas.email, pessoaData.email!))
        .limit(1);

      let pessoaId;

      if (existingPessoa.length > 0) {
        console.log(`  ℹ️  Pessoa already exists: ${existingPessoa[0].nomeCompleto}`);
        pessoaId = existingPessoa[0].id;
        existing++;
      } else {
        // Create pessoa
        const [newPessoa] = await db
          .insert(pessoas)
          .values({
            nomeCompleto: pessoaData.nomeCompleto,
            sexo: pessoaData.sexo,
            email: pessoaData.email,
            cpf: pessoaData.cpf,
            dataNasc: pessoaData.dataNasc,
            telefone: pessoaData.telefone,
            endereco: pessoaData.endereco
          })
          .returning();
        
        console.log(`  ✅ Pessoa created: ${newPessoa.nomeCompleto}`);
        pessoaId = newPessoa.id;
        created++;
      }

      // 2. Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.pessoaId, pessoaId))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`  ℹ️  User already exists for this pessoa`);
        continue;
      }

      // 3. Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // 4. Create user
      const [newUser] = await db
        .insert(users)
        .values({
          pessoaId: pessoaId,
          username: userData.username,
          passwordHash: hashedPassword,
          role: userData.role,
          isActive: userData.isActive,
        })
        .returning();

      console.log(`  ✅ User created with role: ${newUser.role}`);
    }

    console.log('\n🎉 Mock user seeding completed!');
    console.log(`📈 Statistics:`);
    console.log(`   ✅ Created: ${created} new users`);
    console.log(`   ℹ️  Existing: ${existing} users already existed`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('   👤 ADMIN:      admin@seminario.edu / admin123');
    console.log('   📋 SECRETARIA: secretaria@seminario.edu / test123');
    console.log('   👨‍🏫 PROFESSOR:  professor@seminario.edu / test123');
    console.log('   👨‍🏫 PROFESSOR2: ana.professor@seminario.edu / test123');
    console.log('   🎓 ALUNO:      aluno@seminario.edu / test123');
    console.log('   🎓 ALUNO2:     julia.aluna@seminario.edu / test123');
    console.log('   ❌ INATIVO:    inativo@seminario.edu / test123 (conta desativada)');

  } catch (error) {
    console.error('❌ Error seeding mock users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  seedMockUsers();
}

export { seedMockUsers, ensureLoginTestUsers }; 