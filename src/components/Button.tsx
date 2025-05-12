import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  type = 'button',
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Styles de base
  const baseStyles =
    'font-semibold rounded-md transition-colors duration-200 flex items-center justify-center disabled:cursor-not-allowed';

  // Variantes de style
  const variants = {
    primary: 'bg-yellow-400 text-black hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-500',
    secondary: 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-600',
    outline: 'border-2 border-white text-white hover:bg-white hover:text-black disabled:border-gray-400 disabled:text-gray-400',
    ghost: 'text-white hover:text-yellow-400 disabled:text-gray-400',
  };

  // Tailles de bouton
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // Gestion de la largeur
  const width = fullWidth ? 'w-full' : '';

  // Combinaison des classes
  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`;

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin mr-2 h-5 w-5" />
          Chargement...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}