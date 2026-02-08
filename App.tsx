import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestEditor } from './components/RequestEditor';
import { ResponsePanel } from './components/ResponsePanel';
import { AppState, Folder, RequestItem, ApiResponse } from './types';
import { generateId, formatBytes } from './utils/helpers';

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

const App: React.FC = () => {
  // --- State ---
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // --- Handlers ---
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
     // Not used directly in sidebar but logic exists if we want a generic "New" button
     // Current Sidebar uses "New Folder", logic below handles implicit creation via list if needed,
     // but for now we'll stick to editing existing or duplicating. 
     // Let's add a "New Request" feature implicitly: 
     // Actually, let's just create a new request in History when "New Request" is conceptually needed.
     const newReq: RequestItem = {
         id: generateId(),
         name: '',
         url: '',
         method: 'GET',
         parentId: null,
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
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <Sidebar 
        folders={state.folders}
        requests={state.requests}
        activeRequestId={state.activeRequestId}
        onSelectRequest={handleSelectRequest}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onDeleteRequest={handleDeleteRequest}
        onToggleFolder={handleToggleFolder}
        onMoveRequest={handleMoveRequest}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full p-4 gap-4">
        {/* Top Navbar / Shortcuts hint could go here */}
        
        <div className="flex items-center justify-between mb-2">
           <h2 className="text-xl font-semibold text-gray-800">
               {activeRequest ? (activeRequest.name || 'Untitled Request') : 'Dashboard'}
           </h2>
           {!activeRequest && (
               <button 
                onClick={handleCreateRequest}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
               >
                   Create New Request
               </button>
           )}
        </div>

        {activeRequest ? (
           <div className="flex flex-col h-full gap-4 overflow-hidden">
             <div className="flex-none h-1/3 min-h-[300px]">
                <RequestEditor 
                    request={activeRequest}
                    onChange={handleUpdateRequest}
                    onSend={handleSendRequest}
                />
             </div>
             <div className="flex-1 min-h-0 overflow-hidden">
                <ResponsePanel response={response} loading={loading} />
             </div>
           </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-gray-600">Welcome to RC Rest Client</h3>
                <p className="mt-2 text-center max-w-md">Select a request from the sidebar or create a new one to get started. You can organize requests into folders by dragging and dropping.</p>
                <button 
                 onClick={handleCreateRequest}
                 className="mt-6 bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-50 transition"
                >
                    Create Request
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;