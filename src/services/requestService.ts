import { ApiResponse, RequestItem } from '../types';
import { formatBytes } from '../utils/helpers';

export const requestService = {
  sendRequest: async (req: RequestItem, translations: any): Promise<ApiResponse> => {
    if (!req.url) {
      throw new Error(translations.enterUrl);
    }

    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {};
      req.headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          headers[h.key] = h.value;
        });

      const options: RequestInit = {
        method: req.method,
        headers: headers
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType !== 'none') {
        options.body = req.bodyContent;
        if (
          req.bodyType === 'json' &&
          !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')
        ) {
          options.headers = { ...options.headers, 'Content-Type': 'application/json' };
        }
      }

      const proxyUrl = `/api/proxy?url=${encodeURIComponent(req.url)}`;
      const res = await fetch(proxyUrl, options);
      const endTime = performance.now();

      const contentTypeHeader = res.headers.get('content-type');
      const contentType = contentTypeHeader ? contentTypeHeader.toLowerCase() : '';

      let data;
      let sizeBytes = 0;

      const isBinary = /image|video|audio|pdf|zip|octet-stream/.test(contentType);

      if (isBinary) {
        data = await res.blob();
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
    } catch (error: any) {
      return {
        status: 0,
        statusText: translations.networkError,
        headers: {},
        data: error.message || translations.corsError,
        contentType: 'text/plain',
        size: '0 B',
        time: Math.round(performance.now() - startTime),
        isError: true
      };
    }
  }
};
