import { defineConfig } from 'tsup'

export default defineConfig([
  // TypeScript库 - 输出ESM格式
  {
    entry: {
      'index': 'src/index.ts'
    },
    format: ['esm'],  // 只输出ESM格式
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // CLI工具 - 只输出Node.js格式
  {
    entry: {
      'generator/cli': 'src/generator/cli.ts',
    },
    format: ['cjs'],  // 只输出CommonJS格式
    dts: false,       // CLI不需要类型声明
    splitting: false,
    sourcemap: true,
    clean: false,
  }
]) 