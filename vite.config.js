import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
import { VitePWA } from 'vite-plugin-pwa'; // Importar plugin
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'CentralPOS', // Nombre completo al iniciar
                short_name: 'CentralPOS', // Nombre debajo del icono en el celular
                description: 'Control de inventario y ventas',
                theme_color: '#ffffff', // Color de la barra de estado del celular
                background_color: '#F2F4F8', // Color de fondo mientras carga la app (splash screen)
                display: 'standalone', // Elimina la barra de URL del navegador (Look nativo)
                orientation: 'portrait', // Bloquea rotación si lo deseas (opcional)
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192x192.png', // Debes crear estos iconos luego en public/
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/pn,g'
                    },
                    {
                        src: 'pwa-512x512.png', // Propósito 'maskable' para iconos redondos en Android
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
        server: {
    host: true, // Habilita la red en modo desarrollo (npm run dev)
    },
    preview: {
        host: true, // Habilita la red en modo producción (npm run preview)
        port: 4173, // Fijamos el puerto
    },
});
