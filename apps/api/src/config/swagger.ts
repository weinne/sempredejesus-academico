import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '@seminario/shared-config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Acadêmico Seminário API',
      version: '1.0.0',
      description: 'API REST para gerenciamento do sistema acadêmico do seminário',
      contact: {
        name: 'Desenvolvimento',
        email: 'dev@seminario.edu',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.seminario.edu',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login',
        },
      },
      schemas: {
        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            data: {
              type: 'object',
              nullable: true,
              example: null,
            },
          },
        },
        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso',
            },
            data: {
              type: 'object',
              description: 'Dados retornados pela operação',
            },
          },
        },
        // Pessoa Schema
        Pessoa: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único da pessoa',
              example: 1,
            },
            nomeCompleto: {
              type: 'string',
              description: 'Nome completo da pessoa',
              example: 'João Silva Santos',
              minLength: 2,
              maxLength: 120,
            },
            sexo: {
              type: 'string',
              description: 'Sexo da pessoa',
              enum: ['M', 'F', 'O'],
              example: 'M',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email da pessoa',
              example: 'joao@example.com',
            },
            cpf: {
              type: 'string',
              description: 'CPF da pessoa (11 dígitos)',
              pattern: '^\\d{11}$',
              example: '12345678901',
            },
            dataNasc: {
              type: 'string',
              format: 'date',
              description: 'Data de nascimento',
              example: '1990-01-15',
            },
            telefone: {
              type: 'string',
              description: 'Telefone de contato',
              example: '(11) 99999-9999',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do registro',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de última atualização',
            },
          },
          required: ['nomeCompleto', 'sexo'],
        },
        // Create Pessoa Schema
        CreatePessoa: {
          type: 'object',
          properties: {
            nomeCompleto: {
              type: 'string',
              description: 'Nome completo da pessoa',
              example: 'João Silva Santos',
              minLength: 2,
              maxLength: 120,
            },
            sexo: {
              type: 'string',
              description: 'Sexo da pessoa',
              enum: ['M', 'F', 'O'],
              example: 'M',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email da pessoa',
              example: 'joao@example.com',
            },
            cpf: {
              type: 'string',
              description: 'CPF da pessoa (11 dígitos)',
              pattern: '^\\d{11}$',
              example: '12345678901',
            },
            dataNasc: {
              type: 'string',
              format: 'date',
              description: 'Data de nascimento',
              example: '1990-01-15',
            },
            telefone: {
              type: 'string',
              description: 'Telefone de contato',
              example: '(11) 99999-9999',
            },
          },
          required: ['nomeCompleto', 'sexo'],
        },
        // Auth Schemas
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'admin@seminario.edu',
            },
            password: {
              type: 'string',
              description: 'Senha do usuário',
              example: 'admin123',
            },
          },
          required: ['email', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login realizado com sucesso',
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'Token JWT para autenticação',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  description: 'Token para renovação do access token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '1' },
                    email: { type: 'string', example: 'admin@seminario.edu' },
                    nome: { type: 'string', example: 'Administrador' },
                    role: { type: 'string', example: 'ADMIN' },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação e autorização',
      },
      {
        name: 'Pessoas',
        description: 'Gerenciamento de pessoas do sistema',
      },
      {
        name: 'Professores',
        description: 'Gerenciamento de professores',
      },
      {
        name: 'Alunos',
        description: 'Gerenciamento de alunos',
      },
      {
        name: 'Cursos',
        description: 'Gerenciamento de cursos',
      },
      {
        name: 'Disciplinas',
        description: 'Gerenciamento de disciplinas',
      },
      {
        name: 'Turmas',
        description: 'Gerenciamento de turmas',
      },
      {
        name: 'Health',
        description: 'Endpoints de verificação de saúde da API',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Documentação inline nos arquivos de rota
    './src/server.ts',   // Documentação no arquivo principal
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec; 