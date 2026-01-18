import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight',
      h2: 'text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight',
      h3: 'text-lg md:text-xl lg:text-2xl font-semibold tracking-tight',
      h4: 'text-base md:text-lg lg:text-xl font-semibold',
      h5: 'text-sm md:text-base lg:text-lg font-semibold',
      h6: 'text-xs md:text-sm lg:text-base font-semibold',
      body: 'text-sm md:text-base leading-relaxed',
      bodySmall: 'text-xs md:text-sm leading-relaxed',
      caption: 'text-xs text-muted-foreground',
      label: 'text-sm font-medium',
      labelSmall: 'text-xs font-medium',
      code: 'text-sm font-mono',
      large: 'text-lg md:text-xl lg:text-2xl font-semibold',
      small: 'text-xs md:text-sm',
      muted: 'text-sm md:text-base text-muted-foreground',
      error: 'text-sm text-destructive',
      success: 'text-sm text-green-600 dark:text-green-400',
    },
    as: {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      p: 'p',
      span: 'span',
      div: 'div',
      label: 'label',
      code: 'code',
    },
  },
  defaultVariants: {
    variant: 'body',
    as: 'p',
  },
});

type TypographyElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'code';

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'as'>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElement;
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'label'
    | 'labelSmall'
    | 'code'
    | 'large'
    | 'small'
    | 'muted'
    | 'error'
    | 'success';
  // Support label-specific props
  htmlFor?: string;
}

const variantToElementMap: Record<string, TypographyElement> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  bodySmall: 'p',
  caption: 'span',
  label: 'label',
  labelSmall: 'label',
  code: 'code',
  large: 'div',
  small: 'span',
  muted: 'p',
  error: 'p',
  success: 'p',
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, ...props }, ref) => {
    const Component =
      (as as React.ElementType) ||
      (variant ? variantToElementMap[variant] : 'p') ||
      'p';

    return (
      <Component
        ref={ref}
        className={cn(typographyVariants({ variant, as }), className)}
        {...props}
      />
    );
  }
);

Typography.displayName = 'Typography';

export { Typography, typographyVariants };

