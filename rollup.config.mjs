import typescript from '@rollup/plugin-typescript';
export default {
  input: 'src/ts/main.ts',
  output: {
    dir: 'dist/assets',
    format: 'iife',
  },
  plugins: [typescript()],
};
