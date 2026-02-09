import { describe, it, expect, vi } from 'vitest';
import { formatBytes, getMethodBadgeColor } from './helpers';

describe('formatBytes', () => {
    it('formats bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1234)).toBe('1.21 KB');
        expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });

    it('handles custom decimals', () => {
        expect(formatBytes(1234, 3)).toBe('1.205 KB');
    });
});

describe('getMethodBadgeColor', () => {
    it('returns correct color for GET', () => {
        expect(getMethodBadgeColor('GET')).toBe('bg-green-500');
    });

    it('returns correct color for POST', () => {
        expect(getMethodBadgeColor('POST')).toBe('bg-blue-500');
    });

    it('returns default color for unknown method', () => {
        expect(getMethodBadgeColor('UNKNOWN')).toBe('bg-gray-500');
    });
});
