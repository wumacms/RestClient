import React, { useState, useEffect, useCallback } from 'react';
import { RequestItem, HeaderItem, HttpMethod } from '../types';
import { Play, Plus, Trash2, Save } from 'lucide-react';
import { cn, getMethodColor } from '../utils/helpers';
import { generateId } from '../utils/helpers';

interface RequestEditorProps {
  request: RequestItem;
  onChange: (req: RequestItem) => void;
  onSend: (req: RequestItem) => void;
}

// Helper to parse query params from URL
const parseParams = (url: string) => {
    try {
        const [_, query] = url.split('?');
        if (!query) return [];
        return query.split('&').map((pair) => {
            const [key, value] = pair.split('=');
            return { 
                id: Math.random().toString(36).substring(7), // Temp ID for rendering
                key: decodeURIComponent(key || ''), 
                value: decodeURIComponent(value || '') 
            };
        });
    } catch {
        return [];
    }
};

export const RequestEditor: React.FC<RequestEditorProps> = ({ request, onChange, onSend }) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [localParams, setLocalParams] = useState<{id: string, key: string, value: string}[]>([]);

  useEffect(() => {
    const derived = parseParams(request.url);
    setLocalParams(derived);
  }, [request.id]);
  
  const currentParams = parseParams(request.url);

  const updateUrlWithParams = (newParams: {key: string, value: string}[]) => {
      const [base] = request.url.split('?');
      if (newParams.length === 0) {
          onChange({ ...request, url: base });
          return;
      }
      const queryString = newParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&');
      onChange({ ...request, url: `${base}?${queryString}` });
  };

  const handleParamChange = (index: number, field: 'key' | 'value', val: string) => {
      const newParams = [...currentParams];
      newParams[index] = { ...newParams[index], [field]: val };
      updateUrlWithParams(newParams);
  };

  const addParam = () => {
      const newParams = [...currentParams, { id: generateId(), key: '', value: '' }];
      updateUrlWithParams(newParams);
  };

  const removeParam = (index: number) => {
      const newParams = currentParams.filter((_, i) => i !== index);
      updateUrlWithParams(newParams);
  };

  // --- Handlers for Headers ---
  const updateRequest = (updates: Partial<RequestItem>) => {
    onChange({ ...request, ...updates });
  };

  const handleHeaderChange = (id: string, field: 'key' | 'value', val: string) => {
    const newHeaders = request.headers.map(h => h.id === id ? { ...h, [field]: val } : h);
    updateRequest({ headers: newHeaders });
  };

  const addHeader = () => {
    updateRequest({ 
      headers: [...request.headers, { id: generateId(), key: '', value: '', enabled: true }] 
    });
  };

  const removeHeader = (id: string) => {
    updateRequest({ headers: request.headers.filter(h => h.id !== id) });
  };

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  return (
    <div className="flex flex-col bg-white dark:bg-paper rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      
      {/* Top Bar: Method & URL */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-2 items-center flex-wrap md:flex-nowrap">
        <div className="relative group w-full md:w-auto">
            <select
            value={request.method}
            onChange={(e) => updateRequest({ method: e.target.value as HttpMethod })}
            className={cn(
                "w-full md:w-auto appearance-none font-bold text-sm px-4 py-2.5 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white dark:bg-darker min-w-[100px] text-center",
                getMethodColor(request.method)
            )}
            >
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
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
          <Play size={16} fill="currentColor" /> Send
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 pt-2 overflow-x-auto">
        {(['params', 'headers', 'body'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
              activeTab === tab 
                ? "border-blue-500 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-200 dark:hover:border-gray-700"
            )}
          >
            {tab === 'headers' ? `Headers (${request.headers.length})` : tab}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="p-4 bg-white dark:bg-paper">
        
        {activeTab === 'headers' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request Headers</h4>
              <button 
                onClick={addHeader}
                className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <Plus size={14} /> Add Header
              </button>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <div>Key</div>
                    <div>Value</div>
                    <div className="text-center">Action</div>
                </div>
                {request.headers.map(header => (
                <div key={header.id} className="grid grid-cols-[1fr_1fr_40px] gap-2 p-2 group hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <input
                    type="text"
                    value={header.key}
                    placeholder="Key"
                    onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                    className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <input
                    type="text"
                    value={header.value}
                    placeholder="Value"
                    onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                    className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <button 
                    onClick={() => removeHeader(header.id)}
                    className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                    <Trash2 size={14} />
                    </button>
                </div>
                ))}
            </div>
            {request.headers.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                    No headers defined
                </div>
            )}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col">
             <div className="flex items-center gap-4 mb-4 flex-wrap">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Content Type:</label>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded">
                    {(['none', 'json', 'text'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => updateRequest({ bodyType: t })}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded uppercase transition-colors",
                                request.bodyType === t 
                                    ? "bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400" 
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
             </div>
             
             {request.bodyType !== 'none' ? (
                 <textarea
                 value={request.bodyContent}
                 onChange={(e) => updateRequest({ bodyContent: e.target.value })}
                 placeholder={request.bodyType === 'json' ? "{\n  \"key\": \"value\"\n}" : "Text content..."}
                 rows={12}
                 className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-4 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-gray-50 dark:bg-darker"
                 spellCheck={false}
               />
             ) : (
                 <div className="py-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                    This request has no body
                 </div>
             )}
          </div>
        )}

        {activeTab === 'params' && (
           <div className="space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Query Parameters</h4>
              <button 
                onClick={addParam}
                className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <Plus size={14} /> Add Param
              </button>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <div>Key</div>
                    <div>Value</div>
                    <div className="text-center">Action</div>
                </div>
                {currentParams.map((param, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 p-2 group hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <input
                    type="text"
                    value={param.key}
                    placeholder="Key"
                    onChange={(e) => handleParamChange(idx, 'key', e.target.value)}
                    className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <input
                    type="text"
                    value={param.value}
                    placeholder="Value"
                    onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                    className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <button 
                    onClick={() => removeParam(idx)}
                    className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                    <Trash2 size={14} />
                    </button>
                </div>
                ))}
            </div>
            {currentParams.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                    No query parameters. Add one or edit the URL.
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};