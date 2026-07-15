import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
export default defineConfig({
  base: '/nasm-studio-v3/', 
  plugins: [svelte()],
  assetsInclude: ['**/*.elf']
})
