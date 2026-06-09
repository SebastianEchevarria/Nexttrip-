import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        driver: 'driver.html',
        reception: 'reception.html',
        cliente: 'cliente.html',
      }
    }
  }
})
