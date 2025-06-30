import winston from 'winston';
import { config } from './config';

const isDevelopment = config.server.nodeEnv === 'development';

export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isDevelopment
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      : winston.format.json()
  ),
  defaultMeta: { service: 'seminario-academico' },
  transports: [
    new winston.transports.Console(),
    ...(isDevelopment ? [] : [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ]),
  ],
}); 