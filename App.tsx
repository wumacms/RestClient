import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestEditor } from './components/RequestEditor';
import { ResponsePanel } from './components/ResponsePanel';
import { AppState, Folder, RequestItem, ApiResponse } from './types';
import { generateId, formatBytes } from './utils/helpers';
import { Menu, Sun, Moon } from 'lucide-react';

const DEFAULT_STATE: AppState = {
  folders: [
    { id: '1', name: 'User API', isOpen: true, createdAt: Date.now() },
    { id: '2', name: 'Auth Service', isOpen: false, createdAt: Date.now() }
  ],
  requests: [
    { 
      id: 'r1', 
      name: 'Get Users', 
      method: 'GET', 
      url: 'https://jsonplaceholder.typicode.com/users', 
      parentId: '1', 
      headers: [], 
      bodyType: 'none', 
      bodyContent: '', 
      createdAt: Date.now() 
    },
    { 
      id: 'r2', 
      name: 'Create Post', 
      method: 'POST', 
      url: 'https://jsonplaceholder.typicode.com/posts', 
      parentId: null, 
      headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }], 
      bodyType: 'json', 
      bodyContent: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}', 
      createdAt: Date.now() 
    }
  ],
  activeRequestId: 'r1'
};

const STORAGE_KEY = 'rc_client_data';
const THEME_KEY = 'rc_client_theme';

const App: React.FC = () => {
  // --- State ---
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    // Apply class to root for Tailwind Dark Mode
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // --- Handlers ---
  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:", "New Folder");
    if (!name) return;
    const newFolder: Folder = {
      id: generateId(),
      name,
      isOpen: true,
      createdAt: Date.now()
    };
    setState(prev => ({ ...prev, folders: [...prev.folders, newFolder] }));
  };

  const handleRenameFolder = (id: string) => {
    const folder = state.folders.find(f => f.id === id);
    if (!folder) return;
    const name = prompt("Rename folder:", folder.name);
    if (!name || name === folder.name) return;
    
    setState(prev => ({
        ...prev,
        folders: prev.folders.map(f => f.id === id ? { ...f, name } : f)
    }));
  };

  const handleDeleteFolder = (id: string) => {
    if (!confirm("Delete this folder and all its requests?")) return;
    setState(prev => ({
      ...prev,
      folders: prev.folders.filter(f => f.id !== id),
      requests: prev.requests.filter(r => r.parentId !== id) // Cascade delete
    }));
  };

  const handleToggleFolder = (id: string) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f)
    }));
  };

  const handleSelectRequest = (id: string) => {
    setState(prev => ({ ...prev, activeRequestId: id }));
    setResponse(null); // Reset response on switch
  };

  const handleCreateRequest = () => {
     const newReq: RequestItem = {
         id: generateId(),
         name: 'New Request',
         url: '',
         method: 'GET',
         parentId: null, // History by default
         headers: [],
         bodyType: 'none',
         bodyContent: '',
         createdAt: Date.now()
     };
     setState(prev => ({
         ...prev,
         requests: [newReq, ...prev.requests],
         activeRequestId: newReq.id
     }));
     setResponse(null);
  };

  const handleRenameRequest = (id: string) => {
    const req = state.requests.find(r => r.id === id);
    if (!req) return;
    const name = prompt("Rename request:", req.name);
    if (name === null) return; // Cancelled
    
    setState(prev => ({
        ...prev,
        requests: prev.requests.map(r => r.id === id ? { ...r, name: name || req.url } : r)
    }));
  };

  const handleDeleteRequest = (id: string) => {
    setState(prev => {
        const remaining = prev.requests.filter(r => r.id !== id);
        let newActive = prev.activeRequestId;
        if (prev.activeRequestId === id) {
            newActive = remaining.length > 0 ? remaining[0].id : null;
        }
        return {
            ...prev,
            requests: remaining,
            activeRequestId: newActive
        }
    });
  };

  const handleUpdateRequest = (updatedReq: RequestItem) => {
    setState(prev => ({
      ...prev,
      requests: prev.requests.map(r => r.id === updatedReq.id ? updatedReq : r)
    }));
  };

  const handleMoveRequest = (reqId: string, folderId: string | null) => {
    setState(prev => ({
        ...prev,
        requests: prev.requests.map(r => r.id === reqId ? { ...r, parentId: folderId } : r)
    }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rc-client-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const parsed = JSON.parse(evt.target?.result as string);
            // Basic validation
            if (Array.isArray(parsed.folders) && Array.isArray(parsed.requests)) {
                setState(parsed);
                alert("Import successful!");
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Failed to parse JSON.");
        }
    };
    reader.readAsText(file);
  };

  // --- Networking ---
  const handleSendRequest = async (req: RequestItem) => {
    if (!req.url) {
        alert("Please enter a URL");
        return;
    }

    setLoading(true);
    setResponse(null);
    
    const startTime = performance.now();
    
    try {
        const headers: Record<string, string> = {};
        req.headers.filter(h => h.enabled && h.key).forEach(h => {
            headers[h.key] = h.value;
        });

        const options: RequestInit = {
            method: req.method,
            headers: headers,
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.bodyType !== 'none') {
            options.body = req.bodyContent;
            // Auto-add content-type if not present and body is JSON
            if (req.bodyType === 'json' && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
                options.headers = { ...options.headers, 'Content-Type': 'application/json' };
            }
        }

        const res = await fetch(req.url, options);
        const endTime = performance.now();
        
        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            data = await res.text();
        }

        const resHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => resHeaders[k] = v);

        // Calculate approx size
        const sizeBytes = new Blob([typeof data === 'string' ? data : JSON.stringify(data)]).size;

        setResponse({
            status: res.status,
            statusText: res.statusText,
            headers: resHeaders,
            data: data,
            size: formatBytes(sizeBytes),
            time: Math.round(endTime - startTime),
            isError: !res.ok
        });

    } catch (error: any) {
        setResponse({
            status: 0,
            statusText: 'Network Error',
            headers: {},
            data: error.message || 'Failed to fetch. This might be a CORS issue.',
            size: '0 B',
            time: Math.round(performance.now() - startTime),
            isError: true
        });
    } finally {
        setLoading(false);
    }
  };

  const activeRequest = state.requests.find(r => r.id === state.activeRequestId);

  return (
    <div className={theme}>
        <div className="flex h-screen bg-gray-100 dark:bg-darker font-sans text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
            <Sidebar 
                folders={state.folders}
                requests={state.requests}
                activeRequestId={state.activeRequestId}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onSelectRequest={handleSelectRequest}
                onCreateFolder={handleCreateFolder}
                onCreateRequest={handleCreateRequest}
                onRenameFolder={handleRenameFolder}
                onRenameRequest={handleRenameRequest}
                onDeleteFolder={handleDeleteFolder}
                onDeleteRequest={handleDeleteRequest}
                onToggleFolder={handleToggleFolder}
                onMoveRequest={handleMoveRequest}
                onExport={handleExport}
                onImport={handleImport}
            />
            
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-gray-100 dark:bg-darker">
                {/* Mobile/Tablet Header Bar */}
                <div className="md:hidden bg-white dark:bg-paper border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
                        <Menu />
                    </button>
                    <span className="font-semibold text-gray-800 dark:text-gray-100 truncate mx-2">
                        {activeRequest ? (activeRequest.name || 'Untitled') : 'REST Client'}
                    </span>
                    <button onClick={toggleTheme} className="p-2 -mr-2 text-gray-600 dark:text-gray-300">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="hidden md:block text-xl font-semibold text-gray-800 dark:text-gray-100">
                            {activeRequest ? (activeRequest.name || 'Untitled Request') : 'Dashboard'}
                        </h2>
                        
                        <div className="flex items-center gap-4">
                             {/* Desktop Theme Toggle */}
                            <button 
                                onClick={toggleTheme} 
                                className="hidden md:flex p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {!activeRequest && (
                                <button 
                                    onClick={handleCreateRequest}
                                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                                >
                                    Create New Request
                                </button>
                            )}
                        </div>
                    </div>

                    {activeRequest ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex-none">
                            <RequestEditor 
                                request={activeRequest}
                                onChange={handleUpdateRequest}
                                onSend={handleSendRequest}
                            />
                        </div>
                        <div className="flex-none">
                            <ResponsePanel response={response} loading={loading} />
                        </div>
                    </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                            <div className="text-6xl mb-4">🚀</div>
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Welcome to RC Rest Client</h3>
                            <p className="mt-2 text-center max-w-md">Select a request from the sidebar or create a new one to get started. You can organize requests into folders by dragging and dropping.</p>
                            <button 
                            onClick={handleCreateRequest}
                            className="mt-6 bg-white dark:bg-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Create Request
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    </div>
  );
};

export default App;