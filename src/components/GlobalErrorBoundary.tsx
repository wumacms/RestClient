import React from 'react';
import { FallbackProps } from 'react-error-boundary';

export const GlobalFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                    Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    The application encountered an unexpected error.
                </p>
                <pre className="bg-gray-100 dark:bg-gray-950 p-3 rounded text-sm overflow-auto max-h-40 mb-6 border border-gray-200 dark:border-gray-700">
                    <code className="text-red-500 whitespace-pre-wrap break-all">
                        {error instanceof Error ? error.message : String(error)}
                    </code>
                </pre>
                <button
                    onClick={resetErrorBoundary}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Try again
                </button>
            </div>
        </div>
    );
};
