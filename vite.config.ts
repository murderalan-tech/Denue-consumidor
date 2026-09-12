import { writeFileSync } from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Identificador único de este build. Se hornea en el bundle (__APP_VERSION__)
// y también se escribe en public/version.json (queda en la raíz del sitio,
// fuera del bundle con hash) para que la app en el navegador pueda comparar
// "con qué versión cargué" contra "qué versión hay publicada ahora mismo" y
// detectar que hay un deploy nuevo aunque la pestaña nunca se haya cerrado.
const buildId = String(Date.now());
try {
  writeFileSync(
    path.resolve(__dirname, 'public/version.json'),
    JSON.stringify({ version: buildId })
  );
} catch (e) {
  console.warn('No se pudo escribir public/version.json:', e);
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
});
