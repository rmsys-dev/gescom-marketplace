'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/utils';

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid w-full gap-2 data-disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input bg-background outline-none after:absolute after:-inset-x-3 after:-inset-y-2',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        'data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary',
        // Disabled: anel e fundo bem contrastados (não depende de opacity baixa)
        'disabled:cursor-not-allowed disabled:border-2 disabled:border-muted-foreground/70 disabled:bg-muted disabled:opacity-100',
        'data-disabled:cursor-not-allowed data-disabled:border-2 data-disabled:border-muted-foreground/70 data-disabled:bg-muted data-disabled:opacity-100',
        // Disabled + selecionado: preenchimento sólido + indicador legível
        'disabled:data-checked:border-muted-foreground disabled:data-checked:bg-muted-foreground',
        'data-disabled:data-checked:border-muted-foreground data-disabled:data-checked:bg-muted-foreground',
        'dark:disabled:bg-muted dark:data-disabled:bg-muted',
        'dark:disabled:data-checked:bg-muted-foreground dark:data-disabled:data-checked:bg-muted-foreground',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span
          className={cn(
            'absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground',
            // Dot branco/claro sobre o cinza sólido do disabled+checked
            'group-disabled/radio-group-item:bg-background group-disabled/radio-group-item:ring-1 group-disabled/radio-group-item:ring-background/40',
            'group-data-disabled/radio-group-item:bg-background group-data-disabled/radio-group-item:ring-1 group-data-disabled/radio-group-item:ring-background/40',
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
