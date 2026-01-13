'use client';

import { Button } from './ui/button';
import Link from 'next/link';

interface CTAButtonProps {
  href?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'lg' | 'default';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CTAButton({ 
  href = '/auth', 
  variant = 'default', 
  size = 'default', 
  children, 
  className = '',
  onClick 
}: CTAButtonProps) {
  const handleClick = () => {
    // Optional: Add analytics tracking here
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('CTA Click', { props: { location: 'homepage' } });
    }
    if (onClick) onClick();
  };

  if (href.startsWith('#')) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={handleClick}
        asChild
      >
        <a href={href}>{children}</a>
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleClick}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
