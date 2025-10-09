import type { IncomingMessage, ServerResponse } from 'http';

// Simple Vercel serverless media proxy to mirror the dev middleware logic for production
export default async function handler(
  req: IncomingMessage & { query?: any; url?: string },
  res: ServerResponse
) {
  try {
    const requestUrl = new URL(req.url || '', 'http://localhost');
    const targetUrl = requestUrl.searchParams.get('url');
    if (!targetUrl) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing url parameter' }));
      return;
    }

    // Basic validation: only allow http/https
    if (!/^https?:\/\//i.test(targetUrl)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid protocol' }));
      return;
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'LemmyClient (Vercel media proxy)',
        Accept: '*/*',
        Referer: new URL(targetUrl).origin,
      },
    });

    // Propagate status
    res.statusCode = upstream.status;

    // Copy selected headers
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const cacheControl = upstream.headers.get('cache-control');
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);
    const etag = upstream.headers.get('etag');
    if (etag) res.setHeader('ETag', etag);
    const lastModified = upstream.headers.get('last-modified');
    if (lastModified) res.setHeader('Last-Modified', lastModified);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (!upstream.body) {
      const buf = await upstream.arrayBuffer();
      res.end(Buffer.from(buf));
      return;
    }

    // Stream body
    const reader = (upstream.body as any).getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    };
    pump();
  } catch (err: any) {
    console.error('[api/media] error', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(
      JSON.stringify({
        error: 'Media proxy failure',
        message: err?.message || String(err),
      })
    );
  }
}
