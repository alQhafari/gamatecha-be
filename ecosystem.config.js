module.exports = {
  apps: [
    {
      name: 'gamatecha-be',
      script: 'pnpm',
      args: 'run start',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
