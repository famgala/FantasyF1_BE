import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonLoaderProps {
  loadingText?: string;
  spinnerSize?: 'xs' | 'sm' | 'md';
  spinnerColor?: 'primary' | 'secondary' | 'white' | 'success' | 'danger';
  className?: string;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  loadingText = 'Loading...',
  spinnerSize = 'xs',
  spinnerColor = 'white',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={spinnerSize} color={spinnerColor} />
      <span>{loadingText}</span>
    </span>
  );
};

export default ButtonLoader;
