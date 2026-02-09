import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isTauri } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { AppState, Folder, RequestItem } from '../types';
import { generateId } from '../utils/helpers';
import { translations, Language } from '../utils/translations';

const DEFAULT_STATE: AppState = {
  folders: [],
  requests: [],
  activeRequestId: null
};

export type ModalType =
  | 'createFolder'
  | 'renameFolder'
  | 'deleteFolder'
  | 'renameRequest'
  | 'deleteRequest'
  | null;

export interface ModalState {
  type: ModalType;
  id?: string;
  initialValue?: string;
}

const STORAGE_KEY = 'rc_client_data_v2';
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
    // Default to light
    return 'light';
  });

  const [lang, setLang] = useState<Language>(() => {
    const savedLang = localStorage.getItem(LANG_KEY);
    // Default to zh
    return savedLang === 'en' || savedLang === 'zh' ? savedLang : 'zh';
  });

  const t = translations[lang];

  const [activeModal, setActiveModal] = useState<ModalState>({ type: null });

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

  const openCreateFolderModal = () => {
    setActiveModal({ type: 'createFolder' });
  };

  const confirmCreateFolder = (name: string) => {
    if (!name) return;
    const newFolder: Folder = {
      id: generateId(),
      name,
      isOpen: true,
      createdAt: Date.now()
    };
    setState((prev) => ({ ...prev, folders: [...prev.folders, newFolder] }));
    setActiveModal({ type: null });
  };

  const openRenameFolderModal = (id: string) => {
    const folder = state.folders.find((f) => f.id === id);
    if (!folder) return;
    setActiveModal({ type: 'renameFolder', id, initialValue: folder.name });
  };

  const confirmRenameFolder = (name: string) => {
    if (!activeModal.id || !name) return;
    const id = activeModal.id;
    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((f) => (f.id === id ? { ...f, name } : f))
    }));
    setActiveModal({ type: null });
  };

  const openDeleteFolderModal = (id: string) => {
    setActiveModal({ type: 'deleteFolder', id });
  };

  const confirmDeleteFolder = () => {
    if (!activeModal.id) return;
    const id = activeModal.id;
    setState((prev) => ({
      ...prev,
      folders: prev.folders.filter((f) => f.id !== id),
      requests: prev.requests.filter((r) => r.parentId !== id)
    }));
    setActiveModal({ type: null });
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

  const openRenameRequestModal = (id: string) => {
    const req = state.requests.find((r) => r.id === id);
    if (!req) return;
    setActiveModal({ type: 'renameRequest', id, initialValue: req.name });
  };

  const confirmRenameRequest = (name: string) => {
    if (!activeModal.id || !name) return;
    const id = activeModal.id;
    const req = state.requests.find((r) => r.id === id);
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === id ? { ...r, name: name || (req ? req.url : '') } : r))
    }));
    setActiveModal({ type: null });
  };

  const openDeleteRequestModal = (id: string) => {
    setActiveModal({ type: 'deleteRequest', id });
  };

  const confirmDeleteRequest = () => {
    if (!activeModal.id) return;
    const id = activeModal.id;
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
    setActiveModal({ type: null });
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

  const handleExport = async () => {
    const dataStr = JSON.stringify(state, null, 2);

    if (isTauri()) {
      try {
        const filePath = await save({
          filters: [{
            name: 'JSON',
            extensions: ['json']
          }],
          defaultPath: `rc-client-backup-${new Date().toISOString().split('T')[0]}.json`
        });

        if (filePath) {
          await writeTextFile(filePath, dataStr);
          toast.success(t.exportSuccess || 'Export successful');
        }
      } catch (err: any) {
        console.error(err);
        toast.error(t.exportError || 'Export failed: ' + err.message);
      }
    } else {
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rc-client-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (isTauri()) {
      try {
        const filePath = await open({
          multiple: false,
          filters: [{
            name: 'JSON',
            extensions: ['json']
          }]
        });

        if (filePath) {
          const content = await readTextFile(filePath);
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.folders) && Array.isArray(parsed.requests)) {
            setState(parsed);
            toast.success(t.importSuccess);
          } else {
            toast.error(t.invalidFile);
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error(t.failedParse);
      }
    } else {
      const file = e?.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (Array.isArray(parsed.folders) && Array.isArray(parsed.requests)) {
            setState(parsed);
            toast.success(t.importSuccess);
          } else {
            toast.error(t.invalidFile);
          }
        } catch (err) {
          toast.error(t.failedParse);
        }
      };
      reader.readAsText(file);
    }
  };

  return {
    state,
    theme,
    lang,
    t,
    toggleTheme,
    toggleLang,
    activeModal,
    setActiveModal,
    handleCreateFolder: openCreateFolderModal,
    confirmCreateFolder,
    handleRenameFolder: openRenameFolderModal,
    confirmRenameFolder,
    handleDeleteFolder: openDeleteFolderModal,
    confirmDeleteFolder,
    handleToggleFolder,
    handleSelectRequest,
    handleCreateRequest,
    handleRenameRequest: openRenameRequestModal,
    confirmRenameRequest,
    handleDeleteRequest: openDeleteRequestModal,
    confirmDeleteRequest,
    handleUpdateRequest,
    handleMoveRequest,
    handleExport,
    handleImport
  };
};
