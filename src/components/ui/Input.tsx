import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg bg-surface border text-sm text-text-primary outline-none transition-all duration-150 placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/10 ${error ? 'border-danger' : 'border-border'} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
        <textarea
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg bg-surface border text-sm text-text-primary outline-none transition-all duration-150 placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y ${error ? 'border-danger' : 'border-border'} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
        <select
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg bg-surface border text-sm text-text-primary outline-none transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/10 ${error ? 'border-danger' : 'border-border'} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
