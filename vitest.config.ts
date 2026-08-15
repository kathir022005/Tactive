import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 30000,
    include: ['tests/api/**/*.test.ts'],
    // Provide env vars for the Vitest worker process.
    // On CI: MONGO_URI is already set via workflow env: block (takes priority over this).
    // Locally: this acts as a fallback when .env is not present or has issues.
    env: {
      MONGO_URI:
        process.env.MONGO_URI ||
        'mongodb+srv://kathirashok255:Akkathir2005@cluster0.ly7x9.mongodb.net/equipflow?appName=Cluster0',
      JWT_SECRET:
        process.env.JWT_SECRET || 'equipflow_super_secret_jwt_key_2024',
      NODE_ENV: 'test',
      PORT: '3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
