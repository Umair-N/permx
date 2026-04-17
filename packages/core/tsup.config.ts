import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    mongoose: 'src/mongoose.ts',
    express: 'src/express.ts',
  },
  format: ['cjs', 'esm'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['mongoose', 'express'],
});
