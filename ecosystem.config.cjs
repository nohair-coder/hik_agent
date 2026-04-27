module.exports = {
  apps: [
    {
      name: 'hik-backend',
      script: 'dist/index.js',
      cwd: '/opt/hik-agent/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      error_file: '/var/log/hik/backend-error.log',
      out_file: '/var/log/hik/backend-out.log',
      log_file: '/var/log/hik/backend.log',
      time: true,
    },
    {
      name: 'hik-frontend',
      script: 'start.sh',
      cwd: '/opt/hik-agent/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/hik/frontend-error.log',
      out_file: '/var/log/hik/frontend-out.log',
      log_file: '/var/log/hik/frontend.log',
      time: true,
    },
  ],
};
