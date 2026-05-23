import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	base: process.env.NODE_ENV === 'production' ? '/money-manager/' : '/',
	plugins: [tailwindcss(), react()],
	server: {
		host: true,
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://backend:3001',
				changeOrigin: true,
			},
		},
	},
});
