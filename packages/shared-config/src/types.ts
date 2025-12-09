export interface Config {
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
  };
  server: {
    port: number;
    nodeEnv: string;
    appUrl: string;
    apiUrl: string;
  };
  upload: {
    maxSize: string;
    path: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  integrations: {
    directus: {
      url: string;
      email: string;
      password: string;
    };
  };
} 