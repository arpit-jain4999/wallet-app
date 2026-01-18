'use client';

import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

export function Loading({ className, size = 'md', message }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
    >
      <div
        className="animate-spin rounded-full border-4 border-primary border-t-transparent"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
