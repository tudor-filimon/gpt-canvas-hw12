import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

server: {
  watch: {
      usePolling: true
  }
}


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
