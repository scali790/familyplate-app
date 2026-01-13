'use client';

import Link from 'next/link';

interface CTAButtonProps {
  href?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'lg' | 'default';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function CTAButton({ 
  href = '/auth', 
  variant = 'default', 
  size = 'default', 
  children, 
  className = '',
  onClick,
  disabled = false 
}: CTAButtonProps) {
  const handleClick = () => {
    // Optional: Add analytics tracking here
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('CTA Click', { props: { location: 'homepage' } });
    }
    if (onClick) onClick();
  };

  // Base button styles matching the Button component
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    default: "bg-primary text-white hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-surface",
  };
  
  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8",
  };
  
  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  // If disabled, render as button
  if (disabled) {
    return (
      <button 
        className={buttonClasses}
        disabled={true}
      >
        {children}
      </button>
    );
  }

  // If anchor link, render as <a>
  if (href.startsWith('#')) {
    return (
      <a 
        href={href}
        className={buttonClasses}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  // Otherwise render as Next.js Link
  return (
    <Link 
      href={href}
      className={buttonClasses}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
