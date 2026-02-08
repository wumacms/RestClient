import React, { useState } from 'react';
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
import { cn, getMethodColor } from '../utils/helpers';
import { translations } from '../utils/translations';

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

  const handleDragStart = (e: React.DragEvent, reqId: string) => {
    setDraggedRequestId(reqId);
    e.dataTransfer.setData('text/plain', reqId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const reqId = e.dataTransfer.getData('text/plain');
    if (reqId) {
      onMoveRequest(reqId, targetFolderId);
    }
    setDraggedRequestId(null);
  };

  // Group requests by folder
  const unfiledRequests = requests.filter(r => r.parentId === null);
  
  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed md:relative inset-y-0 left-0 w-80 bg-white dark:bg-dark border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
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
            onClick={() => { onCreateRequest(); if(window.innerWidth < 768) onClose(); }}
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
              <label className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer" title={t.importData}>
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
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            className={cn(
              "rounded-lg transition-colors",
              "border border-transparent" 
            )}
          >
            <div className="px-2 py-1.5 flex items-center gap-2 text-gray-500 dark:text-gray-400 font-semibold text-sm uppercase tracking-wider mb-1">
              <History size={14} /> {t.historyUnfiled}
            </div>
            <div className="space-y-0.5">
              {unfiledRequests.map(req => (
                <RequestRow 
                  key={req.id} 
                  req={req} 
                  isActive={req.id === activeRequestId}
                  onClick={() => { onSelectRequest(req.id); if(window.innerWidth < 768) onClose(); }}
                  onRename={() => onRenameRequest(req.id)}
                  onDelete={() => onDeleteRequest(req.id)}
                  onDragStart={(e) => handleDragStart(e, req.id)}
                  t={t}
                />
              ))}
              {unfiledRequests.length === 0 && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 italic px-8 py-2">{t.noUnfiled}</div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

          {/* Folders */}
          <div className="space-y-1">
            {folders.map(folder => {
              const folderRequests = requests.filter(r => r.parentId === folder.id);
              return (
                <div 
                  key={folder.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className="rounded-lg overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                    onClick={() => onToggleFolder(folder.id)}
                  >
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium truncate">
                      {folder.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {folder.isOpen ? <FolderOpen size={16} className="text-yellow-500 flex-shrink-0" /> : <FolderIcon size={16} className="text-yellow-500 flex-shrink-0" />}
                      <span className="truncate">{folder.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-normal flex-shrink-0">({folderRequests.length})</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                          onClick={(e) => { e.stopPropagation(); onRenameFolder(folder.id); }}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          title={t.rename}
                      >
                          <Edit2 size={12} />
                      </button>
                      <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                          title={t.delete}
                      >
                          <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {folder.isOpen && (
                    <div className="pl-4 border-l border-gray-100 dark:border-gray-800 ml-2 space-y-0.5 py-1">
                      {folderRequests.map(req => (
                        <RequestRow 
                          key={req.id} 
                          req={req} 
                          isActive={req.id === activeRequestId}
                          onClick={() => { onSelectRequest(req.id); if(window.innerWidth < 768) onClose(); }}
                          onRename={() => onRenameRequest(req.id)}
                          onDelete={() => onDeleteRequest(req.id)}
                          onDragStart={(e) => handleDragStart(e, req.id)}
                          t={t}
                        />
                      ))}
                      {folderRequests.length === 0 && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 italic px-4 py-1">{t.emptyFolder}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

interface RequestRowProps {
  req: RequestItem;
  isActive: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  t: typeof translations.en;
}

const RequestRow: React.FC<RequestRowProps> = ({ req, isActive, onClick, onRename, onDelete, onDragStart, t }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-all border border-transparent",
        isActive ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50" : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[36px] text-center flex-shrink-0",
          getMethodColor(req.method)
        )}>
          {req.method}
        </span>
        <span className={cn("text-sm truncate", isActive ? "text-blue-900 dark:text-blue-300 font-medium" : "text-gray-600 dark:text-gray-400")}>
          {req.name || req.url || t.newRequest}
        </span>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className={cn(
            "p-1 rounded transition-all",
            isActive ? "text-blue-300 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" : "text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
            )}
            title={t.rename}
        >
            <Edit2 size={12} />
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={cn(
            "p-1 rounded transition-all",
            isActive ? "text-blue-300 dark:text-blue-400 hover:text-red-500" : "text-gray-400 dark:text-gray-500 hover:text-red-500"
            )}
            title={t.delete}
        >
            <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
