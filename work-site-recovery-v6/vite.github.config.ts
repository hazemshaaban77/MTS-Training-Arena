import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
// Static client build. Backend intentionally omitted and stays server-side on Workers.
export default defineConfig({
  base:'/MTS-Training-Arena/v6/',
  plugins:[react()],
  publicDir:'public',
  build:{
    outDir:'dist-github',
    emptyOutDir:true,
    rollupOptions:{input:resolve('index.html')},
  },
});
