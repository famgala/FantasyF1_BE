import React from 'react';

interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      className={`
        flex items-center gap-2 text-sm text-red-600
        ${className}
      `}
      role="alert"
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
};

interface FormFieldErrorProps {
  errors?: string[] | string;
  className?: string;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({
  errors,
  className = '',
}) => {
  if (!errors) return null;

  const errorArray = Array.isArray(errors) ? errors : [errors];

  if (errorArray.length === 0) return null;

  return (
    <div className={`space-y-1 mt-1 ${className}`}>
      {errorArray.map((error, index) => (
        <InlineError key={index} message={error} />
      ))}
    </div>
  );
};

export default InlineError;
