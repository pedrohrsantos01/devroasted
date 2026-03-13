import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const badgeVariants = tv({
  base: "inline-flex items-center gap-2 font-mono leading-none",
  variants: {
    variant: {
      critical: "text-critical",
      warning: "text-warning",
      good: "text-accent-green",
      neutral: "text-muted",
    },
    size: {
      sm: "text-[12px]",
      md: "text-[13px]",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "sm",
  },
});

export const badgeDotVariants = tv({
  base: "rounded-full",
  variants: {
    variant: {
      critical: "bg-critical",
      warning: "bg-warning",
      good: "bg-accent-green",
      neutral: "bg-muted",
    },
    size: {
      sm: "size-2",
      md: "size-2.5",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "sm",
  },
});

export interface BadgeProps
  extends ComponentPropsWithoutRef<"span">,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotClassName?: string;
}

export const Badge = forwardRef<ElementRef<"span">, BadgeProps>(
  (
    { children, className, dot = true, dotClassName, size, variant, ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={badgeVariants({ variant, size, className })}
        {...props}
      >
        {dot ? (
          <span
            aria-hidden="true"
            className={badgeDotVariants({
              variant,
              size,
              className: dotClassName,
            })}
          />
        ) : null}
        <span>{children}</span>
      </span>
    );
  },
);

Badge.displayName = "Badge";
