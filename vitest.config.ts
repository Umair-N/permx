import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/mongoose.ts',
        'src/express.ts',
        'src/types/**',
        'src/middleware/types.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 80,
        functions: 80,
        lines: 70,
      },
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
