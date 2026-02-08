export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestItem {
  id: string;
  name: string; // Defaults to URL or user defined
  method: HttpMethod;
  url: string;
  parentId: string | null; // null means "History" (root), string means folder ID
  headers: HeaderItem[];
  bodyType: 'none' | 'json' | 'text';
  bodyContent: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
  createdAt: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  size: string;
  time: number; // in ms
  isError: boolean;
}

export interface AppState {
  folders: Folder[];
  requests: RequestItem[];
  activeRequestId: string | null;
}
