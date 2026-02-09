import React from 'react';
import { RequestItem } from '../types';
import { cn, getMethodColor } from '../utils/helpers';
import { Edit2, Trash2 } from 'lucide-react';
import { translations } from '../utils/translations';

interface RequestRowProps {
  req: RequestItem;
  isActive: boolean;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  t: typeof translations.en;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  req,
  isActive,
  onClick,
  onRename,
  onDelete,
  onDragStart,
  onDrop,
  onDragOver,
  t
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onClick}
      className={cn(
        'group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-all border border-transparent',
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[36px] text-center flex-shrink-0',
            getMethodColor(req.method)
          )}
        >
          {req.method}
        </span>
        <span
          className={cn(
            'text-sm truncate',
            isActive
              ? 'text-blue-900 dark:text-blue-300 font-medium'
              : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {req.name || req.url || t.newRequest}
        </span>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className={cn(
            'p-1 rounded transition-all',
            isActive
              ? 'text-blue-300 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
              : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
          )}
          title={t.rename}
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            'p-1 rounded transition-all',
            isActive
              ? 'text-blue-300 dark:text-blue-400 hover:text-red-500'
              : 'text-gray-400 dark:text-gray-500 hover:text-red-500'
          )}
          title={t.delete}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
