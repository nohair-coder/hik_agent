module.exports = {
  apps: [
    {
      name: 'hik-agent-backend',
      script: './backend/dist/index.js',
      cwd: '/opt/hik-agent',
      instances: 1,
      exec_mode: 'fork', // Changed from cluster - cluster mode with 1 instance is redundant
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_LEVEL: 'info'
      },
      error_file: '/var/log/hik/backend-error.log',
      out_file: '/var/log/hik/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Health check configuration
      listen_timeout: 5000,
      kill_timeout: 10000,
      wait_ready: true,
      // Graceful reload
      min_uptime: '10s',
      max_restarts: 15,
      restart_delay: 4000,
      // Monitoring
      instance_var: 'INSTANCE_ID'
    },
    {
      name: 'hik-agent-frontend',
      script: './frontend/node_modules/.bin/serve',
      args: '-s frontend/dist -l 3000 --single',
      cwd: '/opt/hik-agent',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/hik/frontend-error.log',
      out_file: '/var/log/hik/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Restart policy
      min_uptime: '10s',
      max_restarts: 15,
      restart_delay: 4000
    }
  ],
  // Global error handler
  error_file: '/var/log/hik/pm2-error.log',
  out_file: '/var/log/hik/pm2-out.log',
  log_file: '/var/log/hik/pm2-combined.log'
};
