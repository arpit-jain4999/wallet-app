/**
 * Export Button Component
 * Smart export button that handles both sync and async exports
 */

'use client';

import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { ButtonVariant, ButtonSize } from '@/lib/enums';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExportButtonProps {
  onClick: () => void;
  isExporting?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  showLabel?: boolean;
}

export function ExportButton({
  onClick,
  isExporting = false,
  disabled = false,
  size = ButtonSize.ICON,
  variant = ButtonVariant.OUTLINE,
  showLabel = false,
}: ExportButtonProps) {
  const button = (
    <Button
      variant={variant}
      onClick={onClick}
      size={size}
      disabled={disabled || isExporting}
      className={showLabel ? '' : ''}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
      )}
    </Button>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{isExporting ? 'Exporting...' : 'Export CSV'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
