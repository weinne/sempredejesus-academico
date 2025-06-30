import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { JwtPayload } from './types';

export class JwtStrategy extends Strategy {
  constructor(
    secret: string,
    verify: (payload: JwtPayload, done: any) => void
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    };

    super(options, verify);
  }
} 