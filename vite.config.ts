import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'cors-proxy',
        configureServer(server) {
          server.middlewares.use('/api/proxy', async (req, res, next) => {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const targetUrl = url.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.end('Missing url query parameter used for proxying');
              return;
            }

            try {
              // Filter out host header and other problematic headers
              const headers: Record<string, string> = {};
              for (const [key, value] of Object.entries(req.headers)) {
                if (key !== 'host' && key !== 'origin' && key !== 'referer' && typeof value === 'string') {
                  headers[key] = value;
                }
              }

              // We need to read the body from the request if it exists
              let body: Buffer | undefined;
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                const chunks = [];
                for await (const chunk of req) {
                  chunks.push(chunk);
                }
                body = Buffer.concat(chunks);
              }

              const proxyRes = await fetch(targetUrl, {
                method: req.method,
                headers: headers,
                body: body as any
              });

              res.statusCode = proxyRes.status;
              res.statusMessage = proxyRes.statusText;

              // Forward headers
              proxyRes.headers.forEach((value, key) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
                  res.setHeader(key, value);
                }
              });

              // Enable CORS for our app
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', '*');

              const arrayBuffer = await proxyRes.arrayBuffer();
              res.end(Buffer.from(arrayBuffer));
            } catch (err: any) {
              console.error('Proxy error:', err);
              res.statusCode = 500;
              res.end(`Proxy Error: ${err.message}`);
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
