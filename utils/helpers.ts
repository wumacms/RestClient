import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getMethodColor(method: string) {
  switch (method) {
    case 'GET': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'POST': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'PUT': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case 'DELETE': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'PATCH': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
}

export function getMethodBadgeColor(method: string) {
    switch (method) {
      case 'GET': return 'bg-green-500';
      case 'POST': return 'bg-blue-500';
      case 'PUT': return 'bg-orange-500';
      case 'DELETE': return 'bg-red-500';
      case 'PATCH': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }