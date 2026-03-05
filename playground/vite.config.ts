import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'nodius-layouting': path.resolve(__dirname, '../src/index.ts'),
    },
  },
});
