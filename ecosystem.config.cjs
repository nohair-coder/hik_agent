module.exports = {
  apps: [
    {
      name: 'hik-agent-backend',
      script: './backend/dist/index.js',
      cwd: '/opt/hik-agent',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/hik/backend-error.log',
      out_file: '/var/log/hik/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'hik-agent-frontend',
      script: 'npx',
      args: 'serve -s frontend/dist -l 3000',
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
      max_memory_restart: '512M'
    }
  ]
};
