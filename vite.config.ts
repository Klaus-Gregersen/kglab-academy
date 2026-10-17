import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { communityVoting } from './server/vite-plugin.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), communityVoting()],
  test: { include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
});
