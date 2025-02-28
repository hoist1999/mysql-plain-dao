import { defineConfig } from 'tsup'

export default defineConfig([
  // TypeScript Library
  {
    entry: {
      'index': 'src/dao/index.ts',
      'generator/index': 'src/generator/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // CLI Tool
  {
    entry: {
      'generator/cli': 'src/generator/cli.ts',
    },
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false
  }
]) 