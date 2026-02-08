import React, { useState, useEffect } from 'react';
import { ApiResponse } from '../types';
import { cn } from '../utils/helpers';
import { Copy, Check, Download, Eye, FileText, FileCode, Music, Video, Image as ImageIcon } from 'lucide-react';
import { translations } from '../utils/translations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResponsePanelProps {
    response: ApiResponse | null;
    loading: boolean;
    t: typeof translations.en;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response, loading, t }) => {
    const [activeTab, setActiveTab] = React.useState<'preview' | 'json' | 'headers' | 'raw'>('json');
    const [copied, setCopied] = React.useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const contentType = response?.contentType?.toLowerCase() || '';
    const isImage = contentType.startsWith('image/');
    const isAudio = contentType.startsWith('audio/');
    const isVideo = contentType.startsWith('video/');
    const isBlob = response?.data instanceof Blob;

    // Naive markdown detection
    const isHtml = contentType.includes('html') || (response?.data && typeof response.data === 'string' && /^\s*(<!DOCTYPE html>|<html)/i.test(response.data)) || false;
    const isMarkdown = !isHtml && (contentType.includes('markdown') || (response?.data && typeof response.data === 'string' && (response.data.includes('# ') || response.data.includes('**')))) || false;

    // Enhanced JSON detection: check content-type OR try to parse string data
    // We do this after isHtml check to avoid false positives if HTML looks like JSON (unlikely but safe)
    const isJson = React.useMemo(() => {
        if (contentType.includes('application/json')) return true;
        if (response?.data && typeof response.data === 'string' && !isHtml && !isMarkdown) {
            try {
                const trimmed = response.data.trim();
                // Simple check to avoid parsing everything: must start/end with {} or []
                if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                    JSON.parse(trimmed);
                    return true;
                }
            } catch (e) {
                return false;
            }
        }
        return false;
    }, [contentType, response, isHtml, isMarkdown]);

    useEffect(() => {
        // Revoke previous URL if exists
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
                // Default tab logic
                if (isMarkdown || isHtml || isJson) { // Use our derived flags which are now available
                    // However, we want to respect the original logic order somewhat, or just use the strongest signal
                    // The previous logic was:
                    // if (type.includes('markdown') || type.includes('html') || hasHtmlContent) -> preview
                    // else if (type.includes('json')) -> json
                    // else -> raw

                    // We can reuse the flags:
                    if (isHtml || isMarkdown) {
                        setActiveTab('preview');
                    } else if (isJson) {
                        // Improved: if it looks like JSON but wasn't auto-detected as application/json, 
                        // we might want to default to json tab OR preview tab (which renders json nicely now).
                        // The original code preferred 'preview' for markdown/html and 'json' for json.
                        // But our preview tab handles non-blob/non-markdown/non-html as text/json fallback.
                        // Let's stick to 'json' tab for JSON content to be explicit.
                        setActiveTab('json');
                    } else {
                        setActiveTab('raw');
                    }
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
        let content = "";
        if (activeTab === 'json') {
            try {
                const dataToCopy = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                content = JSON.stringify(dataToCopy, null, 2);
            } catch (e) {
                // If it fails to parse (shouldn't if isJson is true), fallback to raw string
                content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            }
        } else if (activeTab === 'headers') {
            content = JSON.stringify(response.headers, null, 2);
        } else {
            if (typeof response.data === 'string') {
                content = response.data;
            } else {
                content = "[Binary Data]";
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
            // Create blob from text/json data
            const dataStr = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
            const blob = new Blob([dataStr], { type: contentType || 'text/plain' });
            url = URL.createObjectURL(blob);
            cleanup = true;
        }

        const a = document.createElement('a');
        a.href = url!;

        // Guess extension
        let ext = 'txt';
        if (contentType.includes('json')) ext = 'json';
        else if (isHtml) ext = 'html';
        else if (contentType.includes('markdown')) ext = 'md';
        else if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('jpeg')) ext = 'jpg';
        else if (contentType.includes('pdf')) ext = 'pdf';

        a.download = `response-${Date.now()}.${ext}`;
        a.click();

        if (cleanup) {
            URL.revokeObjectURL(url!);
        }
    };

    // Basic syntax highlighting for JSON
    const renderJson = (data: any) => {
        try {
            const dataToRender = typeof data === 'string' ? JSON.parse(data) : data;
            const json = JSON.stringify(dataToRender, null, 2);
            const html = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
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
                });

            return <code dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
            return <code>{String(data)}</code>
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-paper border-t border-gray-200 dark:border-gray-700 mt-4 shadow-sm rounded-lg overflow-hidden">
            {/* Header Info */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 flex-wrap">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.response}</h3>

                <div className={cn("px-2 py-0.5 rounded text-sm font-bold text-white", isSuccess ? "bg-green-500" : "bg-red-500")}>
                    {response.status} {response.statusText}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">{t.time}: {response.time}ms</span>
                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">{t.size}: {response.size}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-paper">
                <div className="flex overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                            activeTab === 'preview'
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        )}
                    >
                        <Eye size={14} /> {t.preview}
                    </button>

                    {!isBlob && (
                        <>
                            <button
                                onClick={() => setActiveTab('json')}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                    activeTab === 'json'
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                )}
                            >
                                <FileCode size={14} /> JSON
                            </button>
                            <button
                                onClick={() => setActiveTab('raw')}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                    activeTab === 'raw'
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                )}
                            >
                                <FileText size={14} /> RAW
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => setActiveTab('headers')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'headers'
                                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        )}
                    >
                        {t.headers.toUpperCase()}
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" title={t.download}>
                        <Download size={16} />
                    </button>
                    {!isBlob && (
                        <button onClick={handleCopy} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-mono text-sm overflow-x-auto min-h-[150px]">

                {/* Preview Tab */}
                {activeTab === 'preview' && (
                    <div className="w-full h-full flex items-start justify-center">
                        {isImage && blobUrl && (
                            <div className="flex flex-col items-center">
                                <img src={blobUrl} alt="Response content" className="max-w-full max-h-[500px] object-contain rounded border border-gray-200 dark:border-gray-700" />
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><ImageIcon size={12} /> Image Preview</div>
                            </div>
                        )}

                        {isAudio && blobUrl && (
                            <div className="flex flex-col items-center w-full max-w-md py-8">
                                <audio controls src={blobUrl} className="w-full" />
                                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1"><Music size={12} /> Audio Player</div>
                            </div>
                        )}

                        {isVideo && blobUrl && (
                            <div className="flex flex-col items-center w-full">
                                <video controls src={blobUrl} className="max-w-full max-h-[500px] rounded bg-black" />
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Video size={12} /> Video Player</div>
                            </div>
                        )}

                        {!isBlob && isHtml && typeof response.data === 'string' && (
                            <div className="w-full bg-white border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                <iframe
                                    title="HTML Preview"
                                    srcDoc={response.data}
                                    className="w-full h-[600px] border-none"
                                    sandbox="allow-scripts allow-popups allow-forms"
                                />
                            </div>
                        )}

                        {!isBlob && isMarkdown && typeof response.data === 'string' && (
                            <div className="w-full bg-white dark:bg-dark p-4 rounded border border-gray-200 dark:border-gray-700">
                                <article className="markdown-body">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{response.data}</ReactMarkdown>
                                </article>
                            </div>
                        )}

                        {!isBlob && !isMarkdown && !isHtml && (
                            <div className="w-full">
                                {/* Fallback for JSON/Text in preview mode */}
                                {isJson ? (
                                    <pre className="whitespace-pre-wrap break-all text-xs">
                                        {renderJson(response.data)}
                                    </pre>
                                ) : (
                                    <pre className="whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300">
                                        {String(response.data)}
                                    </pre>
                                )}
                            </div>
                        )}

                        {isBlob && !isImage && !isAudio && !isVideo && (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <FileText size={48} className="mb-2 opacity-50" />
                                <p>Binary file ({response.size})</p>
                                <button onClick={handleDownload} className="mt-4 text-blue-600 hover:underline flex items-center gap-2">
                                    <Download size={16} /> {t.download}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* JSON Tab */}
                {activeTab === 'json' && (
                    <pre className="whitespace-pre-wrap break-all">
                        {renderJson(response.data)}
                    </pre>
                )}

                {/* RAW Tab */}
                {activeTab === 'raw' && (
                    <pre className="whitespace-pre-wrap break-all text-gray-600 dark:text-gray-300">
                        {typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}
                    </pre>
                )}

                {/* Headers Tab */}
                {activeTab === 'headers' && (
                    <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                        {Object.entries(response.headers).map(([k, v]) => (
                            <React.Fragment key={k}>
                                <span className="text-blue-600 dark:text-blue-300 font-semibold text-right">{k}:</span>
                                <span className="text-green-600 dark:text-green-300 break-all">{v}</span>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};