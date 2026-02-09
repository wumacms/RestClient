import React, { useState, useRef } from 'react';
import { Folder, RequestItem } from '../types';
import {
  Folder as FolderIcon,
  FolderOpen,
  Plus,
  Trash2,
  History,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Edit2,
  FilePlus,
  X
} from 'lucide-react';
import { cn } from '../utils/helpers';
import { translations } from '../utils/translations';
import { RequestRow } from './RequestRow';

interface SidebarProps {
  folders: Folder[];
  requests: RequestItem[];
  activeRequestId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRequest: (id: string) => void;
  onCreateFolder: () => void;
  onCreateRequest: () => void;
  onRenameFolder: (id: string) => void;
  onRenameRequest: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onMoveRequest: (reqId: string, folderId: string | null) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: typeof translations.en;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  requests,
  activeRequestId,
  isOpen,
  onClose,
  onSelectRequest,
  onCreateFolder,
  onCreateRequest,
  onRenameFolder,
  onRenameRequest,
  onDeleteFolder,
  onDeleteRequest,
  onToggleFolder,
  onMoveRequest,
  onExport,
  onImport,
  t
}) => {
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [draggedOverFolderId, setDraggedOverFolderId] = useState<string | null | undefined>(undefined);
  const [isDraggingMouse, setIsDraggingMouse] = useState(false);
  const enterCounter = useRef(0);

  // Global mouse up handler for drag cancellation
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingMouse) {
        console.log('[Global MouseUp] Cancelling drag');
        setIsDraggingMouse(false);
        setDraggedRequestId(null);
        setDraggedOverFolderId(undefined);
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDraggingMouse]);

  // Track mouse position for drag preview
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMouse) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    if (isDraggingMouse) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isDraggingMouse]);

  const handleDragStart = (e: React.DragEvent, reqId: string) => {
    console.log('[DragStart] Request ID:', reqId);
    setDraggedRequestId(reqId);

    // Set multiple types for broadest compatibility
    e.dataTransfer.setData('text/plain', reqId);
    e.dataTransfer.setData('text', reqId);
    e.dataTransfer.effectAllowed = 'move';
    console.log('[DragStart] Data set, effectAllowed:', e.dataTransfer.effectAllowed);
  };

  // Mouse-based drag as fallback for Tauri
  const handleMouseDown = (e: React.MouseEvent, reqId: string) => {
    if (e.button === 0) { // Left click only
      console.log('[MouseDown] Request ID:', reqId);
      // Prevent default to avoid conflict with native drag
      e.preventDefault();
      setDraggedRequestId(reqId);
      setIsDraggingMouse(true);
      // Change cursor globally
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = (targetFolderId: string | null) => {
    console.log('[MouseUp] Dragging:', isDraggingMouse, 'Target folder:', targetFolderId, 'ReqId:', draggedRequestId);

    // Perform the move operation on mouse up
    if (isDraggingMouse && draggedRequestId) {
      console.log('[MouseUp] Moving request', draggedRequestId, 'to folder', targetFolderId);
      onMoveRequest(draggedRequestId, targetFolderId);
    }

    setIsDraggingMouse(false);
    setDraggedRequestId(null);
    setDraggedOverFolderId(undefined);
    // Restore cursor
    document.body.style.cursor = '';
  };

  const handleMouseEnterFolder = (folderId: string | null) => {
    console.log('[MouseEnter] Folder ID:', folderId, 'isDragging:', isDraggingMouse);
    // Only set highlight, don't move yet
    if (isDraggingMouse) {
      setDraggedOverFolderId(folderId);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Ensure the highlight remains during drag over
    if (draggedOverFolderId !== folderId) {
      console.log('[DragOver] Folder ID:', folderId);
      setDraggedOverFolderId(folderId);
    }
  };

  const handleDragEnter = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    enterCounter.current++;
    console.log('[DragEnter] Folder ID:', folderId, 'Counter:', enterCounter.current);
    setDraggedOverFolderId(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    enterCounter.current--;
    console.log('[DragLeave] Counter:', enterCounter.current);
    if (enterCounter.current <= 0) {
      enterCounter.current = 0;
      setDraggedOverFolderId(undefined);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    // Use multiple keys to retrieve data
    const reqId = e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('text') ||
      draggedRequestId;

    console.log('[Drop] Target Folder ID:', targetFolderId);
    console.log('[Drop] Request ID from dataTransfer:', e.dataTransfer.getData('text/plain'));
    console.log('[Drop] Request ID from state:', draggedRequestId);
    console.log('[Drop] Final Request ID:', reqId);

    if (reqId) {
      console.log('[Drop] Moving request', reqId, 'to folder', targetFolderId);
      onMoveRequest(reqId, targetFolderId);
    } else {
      console.warn('[Drop] No request ID found!');
    }

    enterCounter.current = 0;
    setDraggedRequestId(null);
    setDraggedOverFolderId(undefined);
  };

  const handleDragEnd = () => {
    console.log('[DragEnd] Cleaning up');
    enterCounter.current = 0;
    setDraggedRequestId(null);
    setDraggedOverFolderId(undefined);
    setIsDraggingMouse(false);
  };

  // Group requests by folder
  const unfiledRequests = requests.filter((r) => r.parentId === null);

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <div
        className={cn(
          'fixed md:relative inset-y-0 left-0 w-80 bg-white dark:bg-dark border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-gray-800 dark:text-gray-100">
            <div className="bg-blue-600 text-white p-1 rounded">RC</div>
            {t.appName}
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-2 py-2 flex flex-col gap-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onCreateRequest();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <FilePlus size={16} /> {t.newPost}
          </button>

          <div className="flex items-center justify-between">
            <button
              onClick={onCreateFolder}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors text-xs font-medium flex items-center gap-1"
              title={t.folder}
            >
              <Plus size={14} /> {t.folder}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={onExport}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={t.exportData}
              >
                <Download size={14} />
              </button>
              <label
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title={t.importData}
              >
                <Upload size={14} />
                <input type="file" className="hidden" accept=".json" onChange={onImport} />
              </label>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white dark:bg-dark">
          {/* History / Root */}
          <div
            onDragOver={(e) => handleDragOver(e, null)}
            onDragEnter={(e) => handleDragEnter(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            onMouseEnter={() => handleMouseEnterFolder(null)}
            onMouseUp={() => handleMouseUp(null)}
            className={cn(
              'rounded-lg transition-colors duration-200',
              draggedOverFolderId === null ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'border border-transparent'
            )}
          >
            <div className="px-2 py-1.5 flex items-center gap-2 text-gray-500 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider mb-1">
              <History size={14} /> {t.historyUnfiled}
            </div>
            <div className="space-y-0.5">
              {unfiledRequests.map((req) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  isActive={req.id === activeRequestId}
                  onClick={() => {
                    onSelectRequest(req.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  onRename={() => onRenameRequest(req.id)}
                  onDelete={() => onDeleteRequest(req.id)}
                  onDragStart={(e) => handleDragStart(e, req.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, null)}
                  onDragEnter={(e) => handleDragEnter(e, null)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, null)}
                  onMouseDown={(e) => handleMouseDown(e, req.id)}
                  t={t}
                />
              ))}
              {unfiledRequests.length === 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500 italic px-8 py-2">
                  {t.noUnfiled}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

          {/* Folders */}
          <div className="space-y-1">
            {folders.map((folder) => {
              const folderRequests = requests.filter((r) => r.parentId === folder.id);
              return (
                <div
                  key={folder.id}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragEnter={(e) => handleDragEnter(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  onMouseEnter={() => handleMouseEnterFolder(folder.id)}
                  onMouseUp={() => handleMouseUp(folder.id)}
                  className={cn(
                    'rounded-lg overflow-hidden transition-colors duration-200',
                    draggedOverFolderId === folder.id ? 'bg-blue-50 dark:bg-blue-900/10 ring-2 ring-blue-500/20' : ''
                  )}
                >
                  <div
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                    onClick={() => onToggleFolder(folder.id)}
                  >
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium truncate">
                      {folder.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {folder.isOpen ? (
                        <FolderOpen size={16} className="text-yellow-500 flex-shrink-0" />
                      ) : (
                        <FolderIcon size={16} className="text-yellow-500 flex-shrink-0" />
                      )}
                      <span className="truncate">{folder.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-normal flex-shrink-0">
                        ({folderRequests.length})
                      </span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameFolder(folder.id);
                        }}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        title={t.rename}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {folder.isOpen && (
                    <div className="pl-4 border-l border-gray-100 dark:border-gray-800 ml-2 space-y-0.5 py-1">
                      {folderRequests.map((req) => (
                        <RequestRow
                          key={req.id}
                          req={req}
                          isActive={req.id === activeRequestId}
                          onClick={() => {
                            onSelectRequest(req.id);
                            if (window.innerWidth < 768) onClose();
                          }}
                          onRename={() => onRenameRequest(req.id)}
                          onDelete={() => onDeleteRequest(req.id)}
                          onDragStart={(e) => handleDragStart(e, req.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, folder.id)}
                          onDragEnter={(e) => handleDragEnter(e, folder.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, folder.id)}
                          onMouseDown={(e) => handleMouseDown(e, req.id)}
                          t={t}
                        />
                      ))}
                      {folderRequests.length === 0 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 italic px-4 py-1">
                          {t.emptyFolder}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag Preview */}
      {isDraggingMouse && draggedRequestId && (
        <div
          style={{
            position: 'fixed',
            left: mousePosition.x + 10,
            top: mousePosition.y + 10,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.8,
          }}
          className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-2xl px-3 py-2"
        >
          <div className="flex items-center gap-2">
            {(() => {
              const draggedReq = requests.find(r => r.id === draggedRequestId);
              if (!draggedReq) return null;
              return (
                <>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[36px] text-center',
                      draggedReq.method === 'GET' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                        draggedReq.method === 'POST' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                          draggedReq.method === 'PUT' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                            draggedReq.method === 'DELETE' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                              'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                    )}
                  >
                    {draggedReq.method}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {draggedReq.name || draggedReq.url || t.newRequest}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};
