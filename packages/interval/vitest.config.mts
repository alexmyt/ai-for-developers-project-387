import { defineConfig } from 'vitest/config'

// Домен интервала не знает про DOM: чистое окружение Node.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
  },
})
