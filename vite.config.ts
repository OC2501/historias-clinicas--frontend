import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'redirect-to-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && !req.url.startsWith('/historias-clinicas')) {
            res.statusCode = 302;
            res.setHeader('Location', `/historias-clinicas${req.url === '/' ? '/' : req.url}`);
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  base: '/historias-clinicas/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})