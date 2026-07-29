import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-xs font-semibold text-ink-soft mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border border-border rounded-lg bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
        {...props}
      />
    </div>
  );
}
