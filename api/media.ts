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

async function resolveRedgifs(
  slug: string
): Promise<{ url: string; method: 'api' | 'scrape' } | null> {
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
        if (candidate) return { url: candidate, method: 'api' };
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
        if (m?.[1]) return { url: unescape(m[1]), method: 'scrape' };
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
    let resolutionPath = 'direct';
    const redgifsMatch =
      /https?:\/\/www\.redgifs\.com\/watch\/([a-z0-9]+)/i.exec(targetUrl);
    if (redgifsMatch) {
      const slug = redgifsMatch[1];
      const resolved = await resolveRedgifs(slug);
      if (resolved) {
        finalUrl = resolved.url;
        resolutionPath = `redgifs:${resolved.method}`;
      } else {
        // Fail fast: don't stream the watch HTML to media elements
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Media-Proxy-Resolution', 'redgifs:fail');
        res.end(
          JSON.stringify({
            error: 'redgifs_unresolved',
            message: 'Failed to resolve Redgifs media URL',
            slug,
          })
        );
        return;
      }
    }

    let parsedFinalUrl: URL | null = null;
    try {
      parsedFinalUrl = new URL(finalUrl);
    } catch {
      parsedFinalUrl = null;
    }

    if (
      parsedFinalUrl?.hostname.toLowerCase() === 'i.imgur.com' &&
      parsedFinalUrl.pathname.toLowerCase().endsWith('.gifv')
    ) {
      parsedFinalUrl.pathname = parsedFinalUrl.pathname.replace(
        /\.gifv$/i,
        '.mp4'
      );
      finalUrl = parsedFinalUrl.toString();
      resolutionPath =
        resolutionPath === 'direct'
          ? 'imgur:gifv'
          : `${resolutionPath}|imgur:gifv`;
      console.info('[api/media] Rewrote imgur gifv', {
        targetUrl,
        finalUrl,
        resolutionPath,
      });
    }

    const requestHeaders: Record<string, string> = {
      'User-Agent': 'LemmyClient (Vercel media proxy)',
      Accept: '*/*',
      Referer: redgifsMatch
        ? 'https://www.redgifs.com'
        : new URL(finalUrl).origin,
    };

    if (parsedFinalUrl?.hostname.toLowerCase() === 'i.imgur.com') {
      requestHeaders.Accept = 'video/*;q=1,image/*;q=0.9,*/*;q=0.8';
      requestHeaders.Origin = 'https://imgur.com';
      requestHeaders.Referer = 'https://imgur.com/';
      console.info('[api/media] Applying imgur header tweaks', {
        targetUrl,
        finalUrl,
        resolutionPath,
      });
    }

    const upstream = await fetch(finalUrl, {
      headers: requestHeaders,
    });

    // Propagate status
    res.statusCode = upstream.status;

    // Copy selected headers
    const ct = upstream.headers.get('content-type');
    res.setHeader('X-Media-Proxy-Upstream-Status', String(upstream.status));
    res.setHeader('X-Media-Proxy-Upstream-Url', upstream.url || finalUrl);
    if (ct) {
      res.setHeader('X-Media-Proxy-Upstream-Content-Type', ct);
    }
    // Guard against upstream HTML/JSON delivered to media elements
    const lowerCT = ct?.toLowerCase() || '';
    if (lowerCT.includes('text/html') || lowerCT.includes('application/json')) {
      console.warn('[api/media] Unexpected upstream content type', {
        targetUrl,
        finalUrl,
        resolutionPath,
        upstreamStatus: upstream.status,
        upstreamContentType: ct,
        upstreamFinalUrl: upstream.url,
      });
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-Media-Proxy-Resolution', resolutionPath);
      res.end(
        JSON.stringify({
          error: 'unexpected_content_type',
          message: 'Upstream returned HTML/JSON instead of media',
          contentType: ct,
          url: finalUrl,
        })
      );
      return;
    }
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
    // Debug header for resolution path (direct|redgifs:api|redgifs:scrape)
    res.setHeader('X-Media-Proxy-Resolution', resolutionPath);

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
