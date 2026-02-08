import React from 'react';
import { ApiResponse } from '../types';
import { cn, getMethodBadgeColor } from '../utils/helpers';
import { Copy, Check } from 'lucide-react';

interface ResponsePanelProps {
  response: ApiResponse | null;
  loading: boolean;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response, loading }) => {
  const [activeTab, setActiveTab] = React.useState<'json' | 'headers' | 'raw'>('json');
  const [copied, setCopied] = React.useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p>Sending Request...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 min-h-[200px]">
        <div className="text-6xl mb-4">⚡</div>
        <p>Send a request to see the response here.</p>
      </div>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;

  const handleCopy = () => {
    let content = "";
    if (activeTab === 'json') {
      content = JSON.stringify(response.data, null, 2);
    } else if (activeTab === 'headers') {
      content = JSON.stringify(response.headers, null, 2);
    } else {
      content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    }
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic syntax highlighting for JSON
  const renderJson = (data: any) => {
    try {
        const json = JSON.stringify(data, null, 2);
        // Extremely simple regex-based syntax coloring
        const html = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'text-purple-600'; // number
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'text-blue-600 font-semibold'; // key
                    } else {
                        cls = 'text-green-600'; // string
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'text-orange-600'; // boolean
                } else if (/null/.test(match)) {
                    cls = 'text-gray-500'; // null
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        
        return <code dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
        return <code>{String(data)}</code>
    }
  };

  return (
    <div className="flex flex-col bg-white border-t border-gray-200 mt-4 shadow-sm rounded-lg overflow-hidden">
      {/* Header Info */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800">Response</h3>
        
        <div className={cn("px-2 py-0.5 rounded text-sm font-bold text-white", isSuccess ? "bg-green-500" : "bg-red-500")}>
          {response.status} {response.statusText}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
            <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">Time: {response.time}ms</span>
            <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">Size: {response.size}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <div className="flex">
            {(['json', 'raw', 'headers'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                )}
            >
                {tab.toUpperCase()}
            </button>
            ))}
        </div>
        <button onClick={handleCopy} className="p-2 text-gray-400 hover:text-gray-700">
            {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 bg-slate-900 text-gray-100 font-mono text-sm overflow-x-auto">
            {activeTab === 'json' && (
                <pre className="whitespace-pre-wrap break-all">
                    {renderJson(response.data)}
                </pre>
            )}
             {activeTab === 'raw' && (
                <pre className="whitespace-pre-wrap break-all text-gray-300">
                    {typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}
                </pre>
            )}
            {activeTab === 'headers' && (
                <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                    {Object.entries(response.headers).map(([k, v]) => (
                        <React.Fragment key={k}>
                            <span className="text-blue-300 font-semibold text-right">{k}:</span>
                            <span className="text-green-300 break-all">{v}</span>
                        </React.Fragment>
                    ))}
                </div>
            )}
      </div>
    </div>
  );
};