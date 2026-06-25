import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export function Card({ children, className = '', title, action, onClick }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-xl border border-border p-5 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
