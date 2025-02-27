import { defineConfig } from 'tsup'

export default defineConfig([
  // TypeScript Library - Output ESM format
  {
    entry: {
      'index': 'src/dao/index.ts',
      'generator/index': 'src/generator/index.ts',
    },
    format: ['esm'],  // ESM format only
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // CLI Tool - Node.js format only
  {
    entry: {
      'generator/cli': 'src/generator/cli.ts',
    },
    format: ['cjs'],  // CommonJS format only
    dts: false,       // No type declarations needed for CLI
    splitting: false,
    sourcemap: true,
    clean: false,
  }
]) 