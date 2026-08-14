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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "st-button";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "st-button--sm",
    md: "",
    lg: "st-button--lg",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "st-button--primary",
    secondary: "st-button--secondary",
    outline: "st-button--outline",
    ghost: "st-button--ghost",
    danger: "st-button--danger",
    'subtle-teal': "st-button--subtle-teal",
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {rightIcon && <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>}
    </button>
  );
};
