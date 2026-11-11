import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';

// Same V6 source, two fully separated build outputs. Never deploy the GitHub
// Pages bundle to E2 staging, or a staging bundle to the production site.
const staging=process.env.ARENA_E2_STAGING_BUILD==='1';
if(staging){
 const api=process.env.VITE_ARENA_API_ORIGIN||'';
 if(process.env.VITE_ARENA_STAGE!=='e2-staging'||
   api!=='https://mts-training-arena-e2-staging.pages.dev'){
  throw new Error('E2_STAGING_CONFIG_REQUIRED');
 }
}
export default defineConfig({
 base:staging?'/':'/MTS-Training-Arena/v6/',
 plugins:[react()],
 publicDir:'public',
 build:{
  outDir:staging?'dist-e2-staging':'dist-github',
  emptyOutDir:true,
  rollupOptions:{input:resolve('index.html')},
 },
});
