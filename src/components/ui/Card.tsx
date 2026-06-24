import React from 'react';
import './UI.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`card glass ${className}`}>
      {(title || action) && (
        <div className="card-header flex items-center justify-between">
          {title && <h3 className="card-title font-semibold">{title}</h3>}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
