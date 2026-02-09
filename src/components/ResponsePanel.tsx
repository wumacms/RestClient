import React, { useState, useEffect } from 'react';
import { ApiResponse } from '../types';
import { cn } from '../utils/helpers';
import { Copy, Check, Download, Eye, FileText, FileCode } from 'lucide-react';
import { translations } from '../utils/translations';
import { useResponseDetection } from '../hooks/useResponseDetection';
import { PreviewPanel } from './PreviewPanel';

interface ResponsePanelProps {
  response: ApiResponse | null;
  loading: boolean;
  t: typeof translations.en;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response, loading, t }) => {
  const [activeTab, setActiveTab] = React.useState<'preview' | 'json' | 'headers' | 'raw'>('json');
  const [copied, setCopied] = React.useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const { contentType, isImage, isAudio, isVideo, isBlob, isHtml, isMarkdown, isJson } =
    useResponseDetection(response);

  useEffect(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }

    if (response?.data instanceof Blob) {
      const url = URL.createObjectURL(response.data);
      setBlobUrl(url);
      setActiveTab('preview');
    } else {
      setBlobUrl(null);
      if (response) {
        if (isHtml || isMarkdown) {
          setActiveTab('preview');
        } else if (isJson) {
          setActiveTab('json');
        } else {
          setActiveTab('raw');
        }
      }
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [response, isHtml, isMarkdown, isJson]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p>{t.sending}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 p-8 min-h-[200px]">
        <div className="text-6xl mb-4">⚡</div>
        <p>{t.sendPrompt}</p>
      </div>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;

  const handleCopy = () => {
    let content = '';
    if (activeTab === 'json') {
      try {
        const dataToCopy =
          typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        content = JSON.stringify(dataToCopy, null, 2);
      } catch (e) {
        content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
    } else if (activeTab === 'headers') {
      content = JSON.stringify(response.headers, null, 2);
    } else {
      if (typeof response.data === 'string') {
        content = response.data;
      } else {
        content = '[Binary Data]';
      }
    }
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let url = blobUrl;
    let cleanup = false;

    if (!url) {
      const dataStr =
        typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
      const blob = new Blob([dataStr], { type: contentType || 'text/plain' });
      url = URL.createObjectURL(blob);
      cleanup = true;
    }

    const a = document.createElement('a');
    a.href = url!;

    let ext = 'txt';
    if (contentType.includes('json')) ext = 'json';
    else if (isHtml) ext = 'html';
    else if (contentType.includes('markdown')) ext = 'md';
    else if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
    else if (contentType.includes('gif')) ext = 'gif';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('svg')) ext = 'svg';
    else if (contentType.includes('pdf')) ext = 'pdf';
    else if (contentType.includes('mp4')) ext = 'mp4';
    else if (contentType.includes('webm')) ext = 'webm';
    else if (contentType.includes('mpeg') || contentType.includes('mp3')) ext = 'mp3';
    else if (contentType.includes('wav')) ext = 'wav';
    else if (contentType.includes('zip')) ext = 'zip';
    else if (contentType.includes('xml')) ext = 'xml';

    if (ext === 'txt' && response?.url) {
      try {
        const urlPath = new URL(response.url).pathname;
        const urlExt = urlPath.split('.').pop()?.toLowerCase();
        if (urlExt && /^[a-z0-9]+$/i.test(urlExt) && urlExt.length < 10) {
          ext = urlExt;
        }
      } catch (e) {}
    }

    let filename = `response-${Date.now()}.${ext}`;

    const disposition = response?.headers['content-disposition'];
    if (disposition) {
      const matchUtf8 = disposition.match(/filename\*=utf-8''([^;]+)/i);
      if (matchUtf8 && matchUtf8[1]) {
        try {
          filename = decodeURIComponent(matchUtf8[1]);
        } catch (e) {
          filename = matchUtf8[1];
        }
      } else {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) {
          try {
            filename = decodeURIComponent(match[1]);
          } catch (e) {
            filename = match[1];
          }
        }
      }
    }

    a.download = filename;
    a.click();

    if (cleanup) {
      URL.revokeObjectURL(url!);
    }
  };

  const renderJson = (data: any) => {
    try {
      const dataToRender = typeof data === 'string' ? JSON.parse(data) : data;
      const json = JSON.stringify(dataToRender, null, 2);
      const html = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
          function (match) {
            let cls = 'text-purple-600 dark:text-purple-400';
            if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                cls = 'text-blue-600 dark:text-blue-400 font-semibold';
              } else {
                cls = 'text-green-600 dark:text-green-400';
              }
            } else if (/true|false/.test(match)) {
              cls = 'text-orange-600 dark:text-orange-400';
            } else if (/null/.test(match)) {
              cls = 'text-gray-500 dark:text-gray-400';
            }
            return '<span class="' + cls + '">' + match + '</span>';
          }
        );

      return <code dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      return <code>{String(data)}</code>;
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-paper border-t border-gray-200 dark:border-gray-700 mt-4 shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 flex-wrap">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.response}</h3>

        <div
          className={cn(
            'px-2 py-0.5 rounded text-sm font-bold text-white',
            isSuccess ? 'bg-green-500' : 'bg-red-500'
          )}
        >
          {response.status} {response.statusText}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
          <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">
            {t.time}: {response.time}ms
          </span>
          <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">
            {t.size}: {response.size}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-paper">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            <Eye size={14} /> {t.preview}
          </button>

          {!isBlob && (
            <>
              <button
                onClick={() => setActiveTab('json')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                  activeTab === 'json'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                <FileCode size={14} /> JSON
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                  activeTab === 'raw'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                <FileText size={14} /> RAW
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('headers')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'headers'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            {t.responseHeaders.toUpperCase()}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title={t.download}
          >
            <Download size={16} />
          </button>
          {!isBlob && (
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-mono text-sm overflow-x-auto min-h-[150px]">
        {activeTab === 'preview' && (
          <PreviewPanel
            response={response}
            blobUrl={blobUrl}
            detection={{
              isImage,
              isAudio,
              isVideo,
              isBlob,
              isHtml,
              isMarkdown,
              isJson
            }}
            renderJson={renderJson}
            t={t}
          />
        )}

        {activeTab === 'json' && (
          <pre className="whitespace-pre-wrap break-all">{renderJson(response.data)}</pre>
        )}

        {activeTab === 'raw' && (
          <pre className="whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300">
            {typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}
          </pre>
        )}

        {activeTab === 'headers' && (
          <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            {Object.entries(response.headers).map(([k, v]) => (
              <React.Fragment key={k}>
                <span className="text-blue-600 dark:text-blue-300 font-semibold text-right">
                  {k}:
                </span>
                <span className="text-green-600 dark:text-green-300 break-all">{v}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
