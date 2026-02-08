import React, { useState } from 'react';
import { Folder, RequestItem } from '../types';
import { 
  Folder as FolderIcon, 
  FolderOpen, 
  Plus, 
  Trash2, 
  FileJson, 
  History, 
  Download, 
  Upload,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn, getMethodColor } from '../utils/helpers';

interface SidebarProps {
  folders: Folder[];
  requests: RequestItem[];
  activeRequestId: string | null;
  onSelectRequest: (id: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onMoveRequest: (reqId: string, folderId: string | null) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  requests,
  activeRequestId,
  onSelectRequest,
  onCreateFolder,
  onDeleteFolder,
  onDeleteRequest,
  onToggleFolder,
  onMoveRequest,
  onExport,
  onImport
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
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
          <div className="bg-blue-600 text-white p-1 rounded">RC</div>
          REST Client
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-2 py-2 flex items-center justify-between bg-gray-50 border-b border-gray-200">
        <button 
          onClick={onCreateFolder}
          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs font-medium flex items-center gap-1"
          title="New Folder"
        >
          <Plus size={14} /> Folder
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={onExport}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-200 transition-colors"
            title="Export Data"
          >
            <Download size={14} />
          </button>
          <label className="p-1.5 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-200 transition-colors cursor-pointer" title="Import Data">
            <Upload size={14} />
            <input type="file" className="hidden" accept=".json" onChange={onImport} />
          </label>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        
        {/* History / Root */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
          className={cn(
            "rounded-lg transition-colors",
            "border border-transparent" // placeholder for drop target style
          )}
        >
          <div className="px-2 py-1.5 flex items-center gap-2 text-gray-500 font-semibold text-sm uppercase tracking-wider mb-1">
            <History size={14} /> History / Unfiled
          </div>
          <div className="space-y-0.5">
            {unfiledRequests.map(req => (
              <RequestRow 
                key={req.id} 
                req={req} 
                isActive={req.id === activeRequestId}
                onClick={() => onSelectRequest(req.id)}
                onDelete={() => onDeleteRequest(req.id)}
                onDragStart={(e) => handleDragStart(e, req.id)}
              />
            ))}
             {unfiledRequests.length === 0 && (
                <div className="text-xs text-gray-400 italic px-8 py-2">No unfiled requests</div>
             )}
          </div>
        </div>

        <div className="h-px bg-gray-100 my-2" />

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
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 cursor-pointer group"
                  onClick={() => onToggleFolder(folder.id)}
                >
                  <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    {folder.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {folder.isOpen ? <FolderOpen size={16} className="text-yellow-500" /> : <FolderIcon size={16} className="text-yellow-500" />}
                    {folder.name} 
                    <span className="text-xs text-gray-400 font-normal">({folderRequests.length})</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {folder.isOpen && (
                  <div className="pl-4 border-l border-gray-100 ml-2 space-y-0.5 py-1">
                    {folderRequests.map(req => (
                      <RequestRow 
                        key={req.id} 
                        req={req} 
                        isActive={req.id === activeRequestId}
                        onClick={() => onSelectRequest(req.id)}
                        onDelete={() => onDeleteRequest(req.id)}
                        onDragStart={(e) => handleDragStart(e, req.id)}
                      />
                    ))}
                    {folderRequests.length === 0 && (
                        <div className="text-xs text-gray-400 italic px-4 py-1">Empty folder</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface RequestRowProps {
  req: RequestItem;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

const RequestRow: React.FC<RequestRowProps> = ({ req, isActive, onClick, onDelete, onDragStart }) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-all border border-transparent",
        isActive ? "bg-blue-50 border-blue-100" : "hover:bg-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[36px] text-center",
          getMethodColor(req.method)
        )}>
          {req.method}
        </span>
        <span className={cn("text-sm truncate", isActive ? "text-blue-900 font-medium" : "text-gray-600")}>
          {req.name || req.url || "New Request"}
        </span>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={cn(
          "p-1 rounded opacity-0 group-hover:opacity-100 transition-all",
          isActive ? "text-blue-300 hover:text-red-500 hover:bg-blue-100" : "text-gray-400 hover:text-red-500 hover:bg-gray-200"
        )}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};
