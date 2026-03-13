import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends ComponentPropsWithoutRef<"div"> {}

export const Card = forwardRef<ElementRef<"div">, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden border border-border-primary bg-page text-foreground-inverse",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export interface CardHeaderProps extends ComponentPropsWithoutRef<"div"> {}

export const CardHeader = forwardRef<ElementRef<"div">, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3 p-5", className)}
        {...props}
      />
    );
  },
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends ComponentPropsWithoutRef<"h3"> {}

export const CardTitle = forwardRef<ElementRef<"h3">, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-mono text-[13px] font-normal leading-5 text-foreground-inverse",
          className,
        )}
        {...props}
      />
    );
  },
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends ComponentPropsWithoutRef<"p"> {}

export const CardDescription = forwardRef<
  ElementRef<"p">,
  CardDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("font-sans text-[12px] leading-6 text-muted", className)}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends ComponentPropsWithoutRef<"div"> {}

export const CardContent = forwardRef<ElementRef<"div">, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("px-5 pb-5", className)} {...props} />;
  },
);

CardContent.displayName = "CardContent";
