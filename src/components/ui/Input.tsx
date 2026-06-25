import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-bold text-text-secondary">{label}</label>}
        <input
          ref={ref}
          className={`form-control ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-semibold text-danger">{error}</span>}
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
        {label && <label className="text-sm font-bold text-text-secondary">{label}</label>}
        <textarea
          ref={ref}
          className={`form-control min-h-[110px] resize-y ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-semibold text-danger">{error}</span>}
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
        {label && <label className="text-sm font-bold text-text-secondary">{label}</label>}
        <select
          ref={ref}
          className={`form-control ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs font-semibold text-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';