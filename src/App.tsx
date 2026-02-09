import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestEditor } from './components/RequestEditor';
import { ResponsePanel } from './components/ResponsePanel';
import { ApiResponse, RequestItem } from './types';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { requestService } from './services/requestService';
import { Toaster, toast } from 'sonner';

const App: React.FC = () => {
  const {
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
  } = useAppState();

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onSelectRequest = (id: string) => {
    handleSelectRequest(id);
    setResponse(null);
  };

  const onSendRequest = async (req: RequestItem) => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await requestService.sendRequest(req, t);
      setResponse(res);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const activeRequest = state.requests.find((r) => r.id === state.activeRequestId);

  return (
    <div className={theme}>
      <div className="flex h-screen bg-gray-100 dark:bg-darker font-sans text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
        <Sidebar
          folders={state.folders}
          requests={state.requests}
          activeRequestId={state.activeRequestId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectRequest={onSelectRequest}
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
          t={t}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-gray-100 dark:bg-darker">
          {/* Mobile/Tablet Header Bar */}
          <div className="md:hidden bg-white dark:bg-paper border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
            >
              <Menu />
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-100 truncate mx-2">
              {activeRequest ? activeRequest.name || t.untitled : t.appName}
            </span>
            <div className="flex items-center">
              <button
                onClick={toggleLang}
                className="p-2 text-gray-600 dark:text-gray-300 font-bold text-sm"
              >
                {lang === 'en' ? '中' : 'En'}
              </button>
              <button onClick={toggleTheme} className="p-2 -mr-2 text-gray-600 dark:text-gray-300">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="hidden md:block text-xl font-semibold text-gray-800 dark:text-gray-100">
                {activeRequest ? activeRequest.name || t.untitledRequest : t.dashboard}
              </h2>

              <div className="flex items-center gap-4">
                {/* Desktop Toggles */}
                <button
                  onClick={toggleLang}
                  className="hidden md:flex p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-bold text-xs w-9 h-9 items-center justify-center"
                  title="Switch Language"
                >
                  {lang === 'en' ? '中' : 'En'}
                </button>

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
                    {t.createNewRequest}
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
                    onSend={onSendRequest}
                    t={t}
                  />
                </div>
                <div className="flex-none">
                  <ResponsePanel response={response} loading={loading} t={t} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                  {t.welcomeTitle}
                </h3>
                <p className="mt-2 text-center max-w-md">{t.welcomeMsg}</p>
                <button
                  onClick={handleCreateRequest}
                  className="mt-6 bg-white dark:bg-paper border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t.createRequest}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Toaster theme={theme} richColors position="top-right" closeButton />
    </div>
  );
};

export default App;
