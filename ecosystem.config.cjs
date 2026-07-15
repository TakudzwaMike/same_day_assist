module.exports = {
  apps: [
    {
      name: 'same-day-assist-api',
      script: './node_modules/.bin/tsx',
      args: 'server/src/index.ts',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
