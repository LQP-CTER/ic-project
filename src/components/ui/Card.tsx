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
      className={`professional-card rounded-2xl p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          {title && <h3 className="text-base font-extrabold tracking-tight text-text-primary">{title}</h3>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}