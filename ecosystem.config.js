module.exports = {
  apps: [
    {
      name: 'dextra-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_file: './logs/next-app.log', // Combined log file
      out_file: './logs/out.log', // Standard output log file
      error_file: './logs/error.log', // Error log file
      merge_logs: true, // Combine logs from all instances
      max_memory_restart: '500M', // Restart the app if it exceeds 500MB
    },
  ],
};
