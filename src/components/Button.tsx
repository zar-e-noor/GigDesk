import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'font-semibold px-4 py-2 rounded-lg transition-colors';
  const variantStyles = variant === 'primary' 
    ? 'bg-accent text-white hover:bg-accent-dark' 
    : 'bg-transparent text-ink border border-border hover:bg-gray-100';

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}
