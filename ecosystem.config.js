module.exports = {
  apps: [
    {
      name: 'seminario-api',
      script: './apps/api/dist/server.js',
      cwd: process.cwd(),
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
      },
      
      // Restart configuration
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      
      // Logs
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced settings
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
      
      // Health monitoring
      health_check_grace_period: 30000,
      health_check_fatal_exceptions: true,
      
      // Graceful reload/shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Process management
      merge_logs: true,
      combine_logs: true,
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: process.env.DEPLOY_HOST || 'production-server',
      ref: 'origin/main',
      repo: 'https://github.com/seminario/academico.git',
      path: '/var/www/seminario-academico',
      
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      
      env: {
        NODE_ENV: 'production'
      }
    }
  }
}; 