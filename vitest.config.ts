import path from 'node:path';
import { defineConfig } from 'vitest/config';

const src = path.resolve(__dirname, './src');

const alias = {
  '@/components/ui': path.join(src, 'shared/components/ui'),
  '@/shared': path.join(src, 'shared'),
  '@/features': path.join(src, 'features'),
  '@': src,
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
    ],
  },
});
