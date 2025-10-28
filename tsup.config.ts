import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'out',
  splitting: true,
  minify: false,
  clean: true,
  format: ['esm', 'cjs'],
  sourcemap: true,
})
