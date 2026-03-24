module.exports = {
  apps: [{
    name: 'openclaw-api',
    script: './src/index.js',
    interpreter: 'node',
    interpreter_args: '--experimental-vm-modules',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
