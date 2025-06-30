import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { JWTPayload, User } from './types.js';

export interface PassportStrategyOptions {
  jwtSecret: string;
  userRepository: UserRepository;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export class PassportJWTStrategy {
  private strategy: JwtStrategy;

  constructor(options: PassportStrategyOptions) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: options.jwtSecret,
      algorithms: ['HS256'],
      passReqToCallback: false,
    };

    this.strategy = new JwtStrategy(
      strategyOptions,
      this.verifyCallback(options.userRepository)
    );
  }

  /**
   * Callback de verificação para a estratégia JWT
   */
  private verifyCallback(userRepository: UserRepository) {
    return async (payload: JWTPayload, done: (error: any, user?: any) => void) => {
      try {
        // Verificar se o payload tem os campos obrigatórios
        if (!payload.sub || !payload.email || !payload.role) {
          return done(new Error('Token payload inválido'), false);
        }

        // Buscar o usuário no banco de dados
        const user = await userRepository.findById(payload.sub);

        if (!user) {
          return done(new Error('Usuário não encontrado'), false);
        }

        // Verificar se o usuário está ativo
        if (!user.ativo) {
          return done(new Error('Usuário inativo'), false);
        }

        // Verificar se os dados do payload coincidem com o usuário
        if (user.email !== payload.email || user.role !== payload.role) {
          return done(new Error('Token inválido para este usuário'), false);
        }

        // Sucesso - retornar o usuário sem a senha
        const { senha, ...userWithoutPassword } = user as any;
        return done(null, userWithoutPassword);

      } catch (error) {
        return done(error, false);
      }
    };
  }

  /**
   * Retorna a instância da estratégia para registro no Passport
   */
  getStrategy(): JwtStrategy {
    return this.strategy;
  }
}

/**
 * Factory function para criar uma estratégia JWT configurada
 */
export function createJWTStrategy(options: PassportStrategyOptions): JwtStrategy {
  const jwtStrategy = new PassportJWTStrategy(options);
  return jwtStrategy.getStrategy();
}

/**
 * Configuração alternativa para refresh tokens
 */
export function createRefreshTokenStrategy(options: {
  refreshSecret: string;
  userRepository: UserRepository;
}): JwtStrategy {
  const strategyOptions: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
    secretOrKey: options.refreshSecret,
    algorithms: ['HS256'],
    passReqToCallback: false,
  };

  return new JwtStrategy(strategyOptions, async (payload: any, done) => {
    try {
      if (payload.type !== 'refresh') {
        return done(new Error('Token type inválido'), false);
      }

      const user = await options.userRepository.findById(payload.sub);
      
      if (!user || !user.ativo) {
        return done(new Error('Usuário não encontrado ou inativo'), false);
      }

      const { senha, ...userWithoutPassword } = user as any;
      return done(null, userWithoutPassword);

    } catch (error) {
      return done(error, false);
    }
  });
} 