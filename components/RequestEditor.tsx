import React, { useState, useEffect } from 'react';
import { RequestItem, HeaderItem, HttpMethod } from '../types';
import { Play, Plus, Trash2, Save } from 'lucide-react';
import { cn, getMethodColor } from '../utils/helpers';
import { generateId } from '../utils/helpers';

interface RequestEditorProps {
  request: RequestItem;
  onChange: (req: RequestItem) => void;
  onSend: (req: RequestItem) => void;
}

export const RequestEditor: React.FC<RequestEditorProps> = ({ request, onChange, onSend }) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  // Local state for immediate input feedback, synced with props
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
    <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* Top Bar: Method & URL */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2 items-center">
        <div className="relative group">
            <select
            value={request.method}
            onChange={(e) => updateRequest({ method: e.target.value as HttpMethod })}
            className={cn(
                "appearance-none font-bold text-sm px-4 py-2.5 rounded-l-md border border-r-0 border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white min-w-[100px] text-center",
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
          className="flex-1 px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white"
        />
        
        <button
          onClick={() => onSend(request)}
          className="bg-dark hover:bg-black text-white px-6 py-2.5 rounded-r-md font-medium text-sm flex items-center gap-2 transition-colors"
        >
          <Play size={16} fill="currentColor" /> Send
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 px-4 pt-2">
        {(['params', 'headers', 'body'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
            )}
          >
            {tab === 'headers' ? `Headers (${request.headers.length})` : tab}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="p-4 bg-white">
        
        {activeTab === 'headers' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Request Headers</h4>
              <button 
                onClick={addHeader}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-gray-200"
              >
                <Plus size={14} /> Add Header
              </button>
            </div>
            
            <div className="border rounded-md divide-y divide-gray-100">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-2 bg-gray-50 p-2 text-xs font-semibold text-gray-500">
                    <div>Key</div>
                    <div>Value</div>
                    <div className="text-center">Action</div>
                </div>
                {request.headers.map(header => (
                <div key={header.id} className="grid grid-cols-[1fr_1fr_40px] gap-2 p-2 group hover:bg-gray-50">
                    <input
                    type="text"
                    value={header.key}
                    placeholder="Key"
                    onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                    className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700"
                    />
                    <input
                    type="text"
                    value={header.value}
                    placeholder="Value"
                    onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                    className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700"
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
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                    No headers defined
                </div>
            )}
          </div>
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col">
             <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-semibold text-gray-700">Content Type:</label>
                <div className="flex bg-gray-100 p-1 rounded">
                    {(['none', 'json', 'text'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => updateRequest({ bodyType: t })}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded uppercase",
                                request.bodyType === t ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
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
                 className="w-full border border-gray-300 rounded-md p-4 font-mono text-sm text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-gray-50"
                 spellCheck={false}
               />
             ) : (
                 <div className="py-8 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                    This request has no body
                 </div>
             )}
          </div>
        )}

        {activeTab === 'params' && (
            <div className="text-center py-12 text-gray-400">
                <p>Query parameters are automatically extracted from the URL.</p>
                <div className="mt-4 text-xs bg-yellow-50 text-yellow-700 p-2 rounded inline-block border border-yellow-200">
                    Full query params editor coming soon
                </div>
            </div>
        )}
      </div>
    </div>
  );
};