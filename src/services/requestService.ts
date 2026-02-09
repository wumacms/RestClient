import { ApiResponse, RequestItem } from '../types';
import { isTauri } from '@tauri-apps/api/core';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { formatBytes } from '../utils/helpers';
import { Translations } from '../utils/translations';

export const requestService = {
  sendRequest: async (req: RequestItem, translations: Translations): Promise<ApiResponse> => {
    if (!req.url) {
      throw new Error(translations.enterUrl);
    }

    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {};
      req.headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          // Skip Content-Type for GET/HEAD requests to prevent server rejection
          if ((req.method === 'GET' || req.method === 'HEAD') && h.key.toLowerCase() === 'content-type') {
            return;
          }
          headers[h.key] = h.value;
        });

      const options: RequestInit = {
        method: req.method,
        headers: {
          ...headers,
          // Mimic a standard browser to increase backend compatibility
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType !== 'none') {
        options.body = req.bodyContent;
        if (
          req.bodyType === 'json' &&
          !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')
        ) {
          (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
      }

      let res: Response;
      const isLocalhost = req.url.includes('localhost') || req.url.includes('127.0.0.1');

      if (isTauri()) {
        if (isLocalhost) {
          // Localhost: Safe to use native fetch for 20ms performance and clean console
          try {
            res = await fetch(req.url, options);
          } catch (err) {
            // Fallback just in case
            res = await tauriFetch(req.url, options);
          }
        } else {
          // External URLs: Directly use Tauri to ensure clean console (no CORS errors)
          // and 100% success rate even with custom headers.
          res = await tauriFetch(req.url, options);
        }
      } else {
        // Simple proxy for web version
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(req.url)}`;
        res = await fetch(proxyUrl, options);
      }

      const endTime = performance.now();

      const contentTypeHeader = res.headers.get('content-type');
      const contentType = contentTypeHeader ? contentTypeHeader.toLowerCase() : '';

      let data;
      let sizeBytes = 0;

      const isBinary = /image|video|audio|pdf|zip|octet-stream/.test(contentType);

      if (isBinary) {
        const blobData = await res.blob();
        data = new Blob([blobData], { type: contentType || 'application/octet-stream' });
        sizeBytes = data.size;
      } else {
        const text = await res.text();
        sizeBytes = new Blob([text]).size;

        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        } else {
          data = text;
        }
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => (resHeaders[k] = v));

      return {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        data: data,
        contentType: contentTypeHeader || 'unknown',
        size: formatBytes(sizeBytes),
        time: Math.round(endTime - startTime),
        isError: !res.ok,
        url: req.url
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        status: 0,
        statusText: translations.networkError,
        headers: {},
        data: errorMessage || translations.corsError,
        contentType: 'text/plain',
        size: '0 B',
        time: Math.round(performance.now() - startTime),
        isError: true,
        url: req.url
      };
    }
  }
};
