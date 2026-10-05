'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        outline: 'border border-accent/40 bg-accent/5 hover:bg-accent/20 hover:text-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'transition-all duration-500 hover:border-accent/40 hover:bg-accent/10 hover:text-accent aria-expanded:bg-accent/10 aria-expanded:text-foreground dark:hover:bg-accent/15',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xl: 'h-12 gap-2 rounded-xl px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonTooltip = string | React.ComponentProps<typeof TooltipContent>;

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  tooltip,
  tooltipSide = 'top',
  tooltipOnHover = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Texto do tooltip. Use `false` para desativar. Se omitido, usa `aria-label`. */
    tooltip?: ButtonTooltip | false;
    tooltipSide?: React.ComponentProps<typeof TooltipContent>['side'];
    /** Exibe o tooltip apenas ao passar o mouse, não ao receber foco. */
    tooltipOnHover?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';
  const { 'aria-label': ariaLabel, ...rest } = props;
  const [hoverTooltipOpen, setHoverTooltipOpen] = React.useState(false);

  const button = (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      aria-label={ariaLabel}
      {...rest}
    />
  );

  const resolvedTooltip: ButtonTooltip | undefined =
    tooltip === false
      ? undefined
      : (tooltip ?? (typeof ariaLabel === 'string' ? ariaLabel : undefined));

  if (!resolvedTooltip) {
    return button;
  }

  const contentProps: React.ComponentProps<typeof TooltipContent> =
    typeof resolvedTooltip === 'string' ? { children: resolvedTooltip } : resolvedTooltip;

  if (tooltipOnHover) {
    return (
      <Tooltip
        open={hoverTooltipOpen}
        onOpenChange={(open) => {
          if (!open) setHoverTooltipOpen(false);
        }}
      >
        <TooltipTrigger
          asChild
          onPointerEnter={() => setHoverTooltipOpen(true)}
          onPointerLeave={() => setHoverTooltipOpen(false)}
        >
          {button}
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} {...contentProps} />
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide} {...contentProps} />
    </Tooltip>
  );
}

export { Button, buttonVariants };
