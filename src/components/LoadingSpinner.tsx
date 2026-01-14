import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  fullPage = false,
}) => {
  const spinnerClasses = [
    'spinner',
    `spinner--${size}`,
    `spinner--${variant}`,
  ].join(' ');

  const containerClasses = [
    'spinner-container',
    fullPage && 'spinner-container--full-page',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} />
      {text && <p className="text-body-2 text-secondary mt-4">{text}</p>}
    </div>
  );
};
