import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestService } from './requestService';
import { translations } from '../utils/translations';
import { RequestItem } from '../types';

describe('requestService', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sends simple GET request', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'content-type': 'application/json' }),
            text: async () => JSON.stringify({ id: 1 }),
            blob: async () => new Blob([JSON.stringify({ id: 1 })], { type: 'application/json' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const req: RequestItem = {
            id: '1',
            name: 'Test',
            method: 'GET',
            url: 'http://test.com',
            parentId: null,
            headers: [],
            bodyType: 'none',
            bodyContent: '',
            createdAt: Date.now()
        };

        const res = await requestService.sendRequest(req, translations.en);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/proxy?url='),
            expect.objectContaining({ method: 'GET' })
        );
        expect(res.status).toBe(200);
        expect(res.data).toEqual({ id: 1 });
    });

    it('handles network error', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network Error'));

        const req: RequestItem = {
            id: '1',
            name: 'Test',
            method: 'GET',
            url: 'http://test.com/error',
            parentId: null,
            headers: [],
            bodyType: 'none',
            bodyContent: '',
            createdAt: Date.now()
        };

        const res = await requestService.sendRequest(req, translations.en);

        expect(res.isError).toBe(true);
        // data should be 'Network Error' because requestService catches error and returns it as data
        expect(res.data).toBe('Network Error');
    });
});
