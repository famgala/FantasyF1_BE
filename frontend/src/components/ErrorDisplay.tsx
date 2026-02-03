import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  isRetrying?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  isRetrying = false,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        p-8 rounded-lg bg-red-50 border border-red-200
        text-center max-w-md mx-auto
        ${className}
      `}
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
      <p className="text-red-600 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="
            inline-flex items-center gap-2
            px-4 py-2 bg-red-600 text-white rounded-lg
            hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors font-medium
          "
        >
          {isRetrying ? (
            <>
              <LoadingSpinner size="xs" color="white" />
              <span>Retrying...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{retryText}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
