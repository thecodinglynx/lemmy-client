import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle dynamic proxy
    {
      name: 'dynamic-lemmy-proxy',
      configureServer(server) {
        // Handle Lemmy API proxying
        server.middlewares.use('/api/lemmy', async (req, res) => {
          const start = Date.now();
          const attemptFetch = async (targetUrl: string, attempt: number) => {
            try {
              const response = await fetch(targetUrl, {
                method: req.method || 'GET',
                headers: {
                  Accept: 'application/json',
                  'User-Agent': req.headers['user-agent'] || 'Lemmy Client',
                },
              });
              return response;
            } catch (err: any) {
              const dnsError =
                err?.code === 'ENOTFOUND' ||
                /ENOTFOUND|EAI_AGAIN/.test(err?.message || '');
              if (dnsError && attempt < 2) {
                const delay = 150 * Math.pow(2, attempt);
                console.warn(
                  `🌐 DNS lookup failed (attempt ${attempt + 1}) for ${targetUrl}. Retrying in ${delay}ms`
                );
                await new Promise((r) => setTimeout(r, delay));
                return attemptFetch(targetUrl, attempt + 1);
              }
              throw err;
            }
          };
          try {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const targetServer =
              url.searchParams.get('server') || 'lemmy.world';

            console.log(`🔍 Original URL: ${req.url}`);
            console.log(`🔍 Parsed pathname: ${url.pathname}`);
            console.log(`🔍 Parsed search: ${url.search}`);
            console.log(`🔍 Target server: ${targetServer}`);

            // Clean the server parameter and convert to API v3 path
            url.searchParams.delete('server');
            // Since the middleware strips /api/lemmy, we need to prepend /api/v3
            const apiPath = `/api/v3${url.pathname}${url.search || ''}`;
            const targetUrl = `https://${targetServer}${apiPath}`;

            console.log(`🔍 Final apiPath: ${apiPath}`);
            console.log(`🔄 Proxying ${req.method} ${req.url} → ${targetUrl}`);

            // Forward the request to the target server
            const response = await attemptFetch(targetUrl, 0);

            console.log(`📥 Response from ${targetServer}: ${response.status}`);
            console.log(
              `📥 Response headers:`,
              Object.fromEntries(response.headers.entries())
            );

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader(
              'Access-Control-Allow-Methods',
              'GET, POST, PUT, DELETE, OPTIONS'
            );
            res.setHeader(
              'Access-Control-Allow-Headers',
              'Content-Type, Authorization'
            );

            // Copy response headers, but exclude compression-related headers
            // since we're sending uncompressed data to the client
            response.headers.forEach((value, key) => {
              const lowerKey = key.toLowerCase();
              if (
                !lowerKey.startsWith('access-control-') &&
                !lowerKey.includes('encoding') &&
                lowerKey !== 'content-length' &&
                lowerKey !== 'transfer-encoding'
              ) {
                res.setHeader(key, value);
              }
            });

            res.statusCode = response.status;

            // Stream the response body
            const body = await response.text();
            console.log(`📥 Response body length: ${body.length}`);
            console.log(
              `📥 Response body preview: ${body.substring(0, 200)}...`
            );

            // Try to validate JSON if content-type suggests it
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              try {
                JSON.parse(body);
                console.log(`✅ Response is valid JSON`);
              } catch (e) {
                console.log(`❌ Response is not valid JSON:`, e);
              }
            }

            res.end(body);
          } catch (error: any) {
            console.error('🚨 Proxy error:', error);
            const isDns =
              error?.code === 'ENOTFOUND' ||
              /ENOTFOUND|EAI_AGAIN/.test(error?.message || '');
            res.statusCode = isDns ? 502 : 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Proxy error',
                message: error?.message || String(error),
                code:
                  error?.code || (isDns ? 'DNS_RESOLUTION_FAILED' : 'UNKNOWN'),
                elapsedMs: Date.now() - start,
              })
            );
          }
        });

        // Handle media proxying for CORS
        server.middlewares.use('/api/media', async (req, res) => {
          try {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const targetUrl = url.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }

            console.log(`🖼️ Proxying media: ${targetUrl}`);

            // Forward the request to the target media URL
            const response = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'User-Agent': req.headers['user-agent'] || 'Lemmy Client',
                // Forward relevant headers
                Accept: req.headers['accept'] || '*/*',
                Referer: new URL(targetUrl).origin,
              },
            });

            console.log(
              `📥 Media response: ${response.status} for ${targetUrl}`
            );

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Copy media-specific headers
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            const cacheControl = response.headers.get('cache-control');
            const lastModified = response.headers.get('last-modified');
            const etag = response.headers.get('etag');

            if (contentType) res.setHeader('Content-Type', contentType);
            if (contentLength) res.setHeader('Content-Length', contentLength);
            if (cacheControl) res.setHeader('Cache-Control', cacheControl);
            if (lastModified) res.setHeader('Last-Modified', lastModified);
            if (etag) res.setHeader('ETag', etag);

            res.statusCode = response.status;

            // Stream the media content
            if (response.body) {
              // Convert web ReadableStream to Node.js readable stream
              const reader = response.body.getReader();
              const pump = async () => {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(value);
                  }
                  res.end();
                } catch (error) {
                  console.error('🚨 Stream error:', error);
                  res.end();
                }
              };
              pump();
            } else {
              const buffer = await response.arrayBuffer();
              res.end(Buffer.from(buffer));
            }
          } catch (error) {
            console.error('🚨 Media proxy error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Media proxy error: ' + (error as Error).message,
              })
            );
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: [
            '@headlessui/react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
          ],
          animation: ['framer-motion'],
          media: ['react-player'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'framer-motion',
      'react-player',
    ],
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
});
