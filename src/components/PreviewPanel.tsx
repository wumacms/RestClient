import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ApiResponse } from '../types';
import { Download, FileText, Music, Video, Image as ImageIcon } from 'lucide-react';
import { translations } from '../utils/translations';

interface PreviewPanelProps {
  response: ApiResponse;
  blobUrl: string | null;
  detection: {
    isImage: boolean;
    isAudio: boolean;
    isVideo: boolean;
    isBlob: boolean;
    isHtml: boolean;
    isMarkdown: boolean;
    isJson: boolean;
  };
  renderJson: (data: any) => React.ReactNode;
  t: typeof translations.en;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  response,
  blobUrl,
  detection,
  renderJson,
  t
}) => {
  const { isImage, isAudio, isVideo, isBlob, isHtml, isMarkdown, isJson } = detection;

  return (
    <div className="w-full h-full flex items-start justify-center">
      {isImage && blobUrl && (
        <div className="flex flex-col items-center">
          <img
            src={blobUrl}
            alt="Response content"
            className="max-w-full max-h-[500px] object-contain rounded border border-gray-200 dark:border-gray-700"
          />
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <ImageIcon size={12} /> Image Preview
          </div>
        </div>
      )}

      {isAudio && blobUrl && (
        <div className="flex flex-col items-center w-full max-w-md py-8">
          <audio controls src={blobUrl} className="w-full" />
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
            <Music size={12} /> Audio Player
          </div>
        </div>
      )}

      {isVideo && blobUrl && (
        <div className="flex flex-col items-center w-full">
          <video controls src={blobUrl} className="max-w-full max-h-[500px] rounded bg-black" />
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Video size={12} /> Video Player
          </div>
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
          {isJson ? (
            <pre className="whitespace-pre-wrap break-all text-xs">{renderJson(response.data)}</pre>
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
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = blobUrl!;
              a.download = `response-${Date.now()}`;
              a.click();
            }}
            className="mt-4 text-blue-600 hover:underline flex items-center gap-2"
          >
            <Download size={16} /> {t.download}
          </button>
        </div>
      )}
    </div>
  );
};
