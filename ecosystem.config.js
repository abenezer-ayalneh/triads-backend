module.exports = {
	apps: [
		{
			name: 'triads-backend',
			script: 'dist/src/main.js',
			watch: false, // Disable watch in production to reduce memory usage
			ignore_watch: ['node_modules', 'logs', 'data', 'dist'],
			instances: 1,
			autorestart: true,
			max_memory_restart: '1G', // Restart if memory exceeds 1GB
			env: {
				NODE_ENV: 'development',
			},
			env_production: {
				NODE_ENV: 'production',
			},
			time: true,
			restart_delay: 3000,
			max_restarts: 10,
		},
	],
}
