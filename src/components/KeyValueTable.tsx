import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueTableProps {
  items: { key: string; value: string; id?: string }[];
  onAdd: () => void;
  onChange: (index: number, field: 'key' | 'value', value: string) => void;
  onRemove: (index: number) => void;
  title: string;
  addButtonLabel: string;
  labels: {
    key: string;
    value: string;
    action: string;
    empty: string;
  };
}

export const KeyValueTable: React.FC<KeyValueTableProps> = ({
  items,
  onAdd,
  onChange,
  onRemove,
  title,
  addButtonLabel,
  labels
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
        <button
          onClick={onAdd}
          className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <Plus size={14} /> {addButtonLabel}
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700">
        <div className="grid grid-cols-[1fr_1fr_40px] gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <div>{labels.key}</div>
          <div>{labels.value}</div>
          <div className="text-center">{labels.action}</div>
        </div>
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="grid grid-cols-[1fr_1fr_40px] gap-2 p-2 group hover:bg-gray-50 dark:hover:bg-gray-800/30"
          >
            <input
              type="text"
              value={item.key}
              placeholder={labels.key}
              onChange={(e) => onChange(idx, 'key', e.target.value)}
              className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
            />
            <input
              type="text"
              value={item.value}
              placeholder={labels.value}
              onChange={(e) => onChange(idx, 'value', e.target.value)}
              className="border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent px-2 py-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
            />
            <button
              onClick={() => onRemove(idx)}
              className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
          {labels.empty}
        </div>
      )}
    </div>
  );
};
