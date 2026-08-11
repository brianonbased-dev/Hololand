import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // TODO: Enable once @hololand/platform-runtime types are complete
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@holoscript/core', '@hololand/platform-runtime', 'three'],
});
