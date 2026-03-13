import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
  base: "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-none border border-transparent px-6 py-2.5 font-mono text-[13px] leading-none font-medium text-page transition duration-200 ease-out enabled:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    variant: {
      primary:
        "bg-accent-green text-page enabled:hover:opacity-90 enabled:active:opacity-80",
      secondary:
        "bg-secondary text-foreground enabled:hover:opacity-90 enabled:active:opacity-80",
      outline:
        "border-border-primary bg-transparent text-foreground enabled:hover:bg-black/5 enabled:active:bg-black/10",
      ghost:
        "bg-transparent text-foreground enabled:hover:bg-black/5 enabled:active:bg-black/10",
      destructive:
        "bg-destructive text-white enabled:hover:opacity-90 enabled:active:opacity-80",
    },
    size: {
      sm: "px-4 py-2 text-[12px]",
      md: "px-6 py-2.5 text-[13px]",
      lg: "px-7 py-3 text-[14px]",
      icon: "size-10 p-0",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
});

export interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<ElementRef<"button">, ButtonProps>(
  ({ className, fullWidth, size, type = "button", variant, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, fullWidth, className })}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
