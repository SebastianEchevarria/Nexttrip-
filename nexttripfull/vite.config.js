import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        driver: 'driver.html',
        'driver-desktop': 'driver-desktop.html',
        reception: 'reception.html',
        cliente: 'cliente.html',
      }
    }
  }
})
