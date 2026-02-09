import React, { useState } from 'react';
import { RequestItem, HttpMethod } from '../types';
import { Play } from 'lucide-react';
import { cn, getMethodColor } from '../utils/helpers';
import { generateId } from '../utils/helpers';
import { translations } from '../utils/translations';
import { KeyValueTable } from './KeyValueTable';

interface RequestEditorProps {
  request: RequestItem;
  onChange: (req: RequestItem) => void;
  onSend: (req: RequestItem) => void;
  t: typeof translations.en;
}

// Helper to parse query params from URL
const parseParams = (url: string) => {
  try {
    const [_, query] = url.split('?');
    if (!query) return [];
    return query.split('&').map((pair) => {
      const [key, value] = pair.split('=');
      return {
        id: Math.random().toString(36).substring(7),
        key: decodeURIComponent(key || ''),
        value: decodeURIComponent(value || '')
      };
    });
  } catch {
    return [];
  }
};

export const RequestEditor: React.FC<RequestEditorProps> = ({ request, onChange, onSend, t }) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  const updateUrlWithParams = (newParams: { key: string; value: string }[]) => {
    const [base] = request.url.split('?');
    if (newParams.length === 0) {
      onChange({ ...request, url: base });
      return;
    }
    const queryString = newParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    onChange({ ...request, url: `${base}?${queryString}` });
  };

  const handleParamChange = (index: number, field: 'key' | 'value', val: string) => {
    const currentParams = parseParams(request.url);
    const newParams = [...currentParams];
    newParams[index] = { ...newParams[index], [field]: val };
    updateUrlWithParams(newParams);
  };

  const addParam = () => {
    const currentParams = parseParams(request.url);
    const newParams = [...currentParams, { id: generateId(), key: '', value: '' }];
    updateUrlWithParams(newParams);
  };

  const removeParam = (index: number) => {
    const currentParams = parseParams(request.url);
    const newParams = currentParams.filter((_, i) => i !== index);
    updateUrlWithParams(newParams);
  };

  const updateRequest = (updates: Partial<RequestItem>) => {
    onChange({ ...request, ...updates });
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', val: string) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: val };
    updateRequest({ headers: newHeaders });
  };

  const addHeader = () => {
    updateRequest({
      headers: [...request.headers, { id: generateId(), key: '', value: '', enabled: true }]
    });
  };

  const removeHeader = (index: number) => {
    updateRequest({ headers: request.headers.filter((_, i) => i !== index) });
  };

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const getTabLabel = (tab: 'params' | 'headers' | 'body') => {
    switch (tab) {
      case 'params':
        return t.params;
      case 'headers':
        return `${t.headers} (${request.headers.length})`;
      case 'body':
        return t.body;
    }
  };

  const currentParams = parseParams(request.url);

  return (
    <div className="flex flex-col bg-white dark:bg-paper rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Top Bar: Method & URL */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-2 items-center flex-wrap md:flex-nowrap">
        <div className="relative group w-full md:w-auto">
          <select
            value={request.method}
            onChange={(e) => updateRequest({ method: e.target.value as HttpMethod })}
            className={cn(
              'w-full md:w-auto appearance-none font-bold text-sm px-4 py-2.5 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white dark:bg-darker min-w-[100px] text-center',
              getMethodColor(request.method)
            )}
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value, name: e.target.value })}
          placeholder="https://api.example.com/v1/resource"
          className="flex-1 w-full md:w-auto px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-darker"
        />

        <button
          onClick={() => onSend(request)}
          className="w-full md:w-auto bg-dark dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white px-6 py-2.5 rounded-r-md font-medium text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Play size={16} fill="currentColor" /> {t.send}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 pt-2 overflow-x-auto">
        {(['params', 'headers', 'body'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap',
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-gray-700'
            )}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="p-4 bg-white dark:bg-paper">
        {activeTab === 'headers' && (
          <KeyValueTable
            items={request.headers}
            onAdd={addHeader}
            onChange={handleHeaderChange}
            onRemove={removeHeader}
            title={t.headers}
            addButtonLabel={t.addHeader}
            labels={{
              key: t.key,
              value: t.value,
              action: t.action,
              empty: t.noHeaders
            }}
          />
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t.contentType}:
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded">
                {(['none', 'json', 'text'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateRequest({ bodyType: type })}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded uppercase transition-colors',
                      request.bodyType === type
                        ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {request.bodyType !== 'none' ? (
              <textarea
                value={request.bodyContent}
                onChange={(e) => updateRequest({ bodyContent: e.target.value })}
                placeholder={
                  request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Text content...'
                }
                rows={12}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-4 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-darker"
                spellCheck={false}
              />
            ) : (
              <div className="py-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                {t.noBody}
              </div>
            )}
          </div>
        )}

        {activeTab === 'params' && (
          <KeyValueTable
            items={currentParams}
            onAdd={addParam}
            onChange={handleParamChange}
            onRemove={removeParam}
            title={t.queryParams}
            addButtonLabel={t.addParam}
            labels={{
              key: t.key,
              value: t.value,
              action: t.action,
              empty: t.noParams
            }}
          />
        )}
      </div>
    </div>
  );
};
