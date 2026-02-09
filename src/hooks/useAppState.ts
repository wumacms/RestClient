import { useState, useEffect } from 'react';
import { AppState, Folder, RequestItem } from '../types';
import { generateId } from '../utils/helpers';
import { translations, Language } from '../utils/translations';

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
const LANG_KEY = 'rc_client_lang';

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [lang, setLang] = useState<Language>(() => {
    const savedLang = localStorage.getItem(LANG_KEY);
    return savedLang === 'en' || savedLang === 'zh' ? savedLang : 'en';
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'zh' : 'en'));

  const handleCreateFolder = () => {
    const name = prompt(t.enterFolderName, t.defaultFolderName);
    if (!name) return;
    const newFolder: Folder = {
      id: generateId(),
      name,
      isOpen: true,
      createdAt: Date.now()
    };
    setState((prev) => ({ ...prev, folders: [...prev.folders, newFolder] }));
  };

  const handleRenameFolder = (id: string) => {
    const folder = state.folders.find((f) => f.id === id);
    if (!folder) return;
    const name = prompt(t.renameFolder, folder.name);
    if (!name || name === folder.name) return;

    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, name } : f))
    }));
  };

  const handleDeleteFolder = (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    setState((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== id),
      requests: prev.requests.filter((r) => r.parentId !== id)
    }));
  };

  const handleToggleFolder = (id: string) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f))
    }));
  };

  const handleSelectRequest = (id: string) => {
    setState((prev) => ({ ...prev, activeRequestId: id }));
  };

  const handleCreateRequest = () => {
    const newReq: RequestItem = {
      id: generateId(),
      name: t.newRequest,
      url: '',
      method: 'GET',
      parentId: null,
      headers: [],
      bodyType: 'none',
      bodyContent: '',
      createdAt: Date.now()
    };
    setState((prev) => ({
      ...prev,
      requests: [newReq, ...prev.requests],
      activeRequestId: newReq.id
    }));
  };

  const handleRenameRequest = (id: string) => {
    const req = state.requests.find((r) => r.id === id);
    if (!req) return;
    const name = prompt(t.renameRequest, req.name);
    if (name === null) return;

    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === id ? { ...r, name: name || req.url } : r))
    }));
  };

  const handleDeleteRequest = (id: string) => {
    setState((prev) => {
      const remaining = prev.requests.filter((r) => r.id !== id);
      let newActive = prev.activeRequestId;
      if (prev.activeRequestId === id) {
        newActive = remaining.length > 0 ? remaining[0].id : null;
      }
      return {
        ...prev,
        requests: remaining,
        activeRequestId: newActive
      };
    });
  };

  const handleUpdateRequest = (updatedReq: RequestItem) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === updatedReq.id ? updatedReq : r))
    }));
  };

  const handleMoveRequest = (reqId: string, folderId: string | null) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === reqId ? { ...r, parentId: folderId } : r))
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
        if (Array.isArray(parsed.folders) && Array.isArray(parsed.requests)) {
          setState(parsed);
          alert(t.importSuccess);
        } else {
          alert(t.invalidFile);
        }
      } catch (err) {
        alert(t.failedParse);
      }
    };
    reader.readAsText(file);
  };

  return {
    state,
    theme,
    lang,
    t,
    toggleTheme,
    toggleLang,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleToggleFolder,
    handleSelectRequest,
    handleCreateRequest,
    handleRenameRequest,
    handleDeleteRequest,
    handleUpdateRequest,
    handleMoveRequest,
    handleExport,
    handleImport
  };
};
