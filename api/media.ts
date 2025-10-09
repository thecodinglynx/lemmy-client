import type { IncomingMessage, ServerResponse } from 'http';

// --- Redgifs resolution support (mirrors dev middleware behavior) ---
interface RedgifsTokenCache {
  token: string;
  fetched: number;
}
let redgifsToken: RedgifsTokenCache | null = null;
const REDGIFS_TOKEN_TTL_MS = 15 * 60 * 1000;

async function getRedgifsToken(): Promise<string | null> {
  const now = Date.now();
  if (redgifsToken && now - redgifsToken.fetched < REDGIFS_TOKEN_TTL_MS) {
    return redgifsToken.token;
  }
  try {
    const resp = await fetch('https://api.redgifs.com/v2/auth/temporary');
    if (!resp.ok) return null;
    const data: any = await resp.json();
    if (data?.token) {
      redgifsToken = { token: data.token, fetched: now };
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveRedgifs(slug: string): Promise<string | null> {
  // Try API first
  try {
    const token = await getRedgifsToken();
    if (token) {
      const apiUrl = `https://api.redgifs.com/v2/gifs/${encodeURIComponent(slug)}`;
      const resp = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const gif = data?.gif;
        const candidate =
          gif?.urls?.hd || gif?.urls?.sd || gif?.urls?.gif || gif?.urls?.poster;
        if (candidate) return candidate;
      }
    }
  } catch {}
  // Fallback: basic HTML scrape for mp4 sources
  try {
    const page = await fetch(`https://www.redgifs.com/watch/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (LemmyClient Redgifs Resolver)',
        Accept: 'text/html',
      },
    });
    if (page.ok) {
      const html = await page.text();
      const unescape = (s: string) => s.replace(/\\\//g, '/');
      const patterns = [
        /"hdSrc"\s*:\s*"(https:[^"\\]+?\.mp4)"/i,
        /"sdSrc"\s*:\s*"(https:[^"\\]+?\.mp4)"/i,
        /"gif"\s*:\s*"(https:[^"\\]+?\.mp4)"/i,
      ];
      for (const p of patterns) {
        const m = p.exec(html);
        if (m?.[1]) return unescape(m[1]);
      }
    }
  } catch {}
  return null;
}

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

    let finalUrl = targetUrl;
    const redgifsMatch =
      /https?:\/\/www\.redgifs\.com\/watch\/([a-z0-9]+)/i.exec(targetUrl);
    if (redgifsMatch) {
      const slug = redgifsMatch[1];
      const resolved = await resolveRedgifs(slug);
      if (resolved) {
        finalUrl = resolved;
      }
    }

    const upstream = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'LemmyClient (Vercel media proxy)',
        Accept: '*/*',
        Referer: redgifsMatch
          ? 'https://www.redgifs.com'
          : new URL(finalUrl).origin,
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
    // Avoid setting content-length if we will stream (some upstream responses may be chunked)
    const contentLength = upstream.headers.get('content-length');
    if (contentLength && !upstream.body)
      res.setHeader('Content-Length', contentLength);

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
