/**
 * PM2 Process Configuration for Next.js Frontend (Production)
 * Run: pm2 start ecosystem.config.cjs
 * Reload: pm2 reload ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "store-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      watch: false,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
