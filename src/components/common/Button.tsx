import React from 'react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger' 
  | 'subtle-teal';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isPill?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isPill = false,
  leftIcon,
  rightIcon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[32px]",
    md: "text-sm px-4 py-2 gap-2 min-h-[38px]",
    lg: "text-sm sm:text-base px-5 py-2.5 gap-2.5 min-h-[44px]",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-xs",
    secondary: "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-xs",
    outline: "bg-transparent text-teal-700 border border-teal-600/60 hover:bg-teal-50/50 active:bg-teal-100/50",
    ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 active:bg-slate-200/60",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100/80 active:bg-rose-200/60",
    'subtle-teal': "bg-teal-50/80 text-teal-800 border border-teal-200/60 hover:bg-teal-100/70 hover:border-teal-300/80 active:bg-teal-200/60 font-semibold",
  };

  const roundedStyles = isPill ? "rounded-full" : "rounded-xl";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${roundedStyles} ${widthStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {rightIcon && <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>}
    </button>
  );
};

