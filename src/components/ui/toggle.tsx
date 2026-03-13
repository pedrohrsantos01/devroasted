"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ElementRef,
  forwardRef,
  useContext,
  useId,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { cn } from "@/lib/utils";

export const toggleRootVariants = tv({
  base: "peer inline-flex shrink-0 items-center rounded-full border border-transparent bg-border-primary p-[3px] transition duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page data-[checked]:bg-accent-green data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  variants: {
    size: {
      sm: "h-5 w-9",
      md: "h-[22px] w-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const toggleThumbVariants = tv({
  base: "pointer-events-none block rounded-full bg-muted transition-transform duration-200 ease-out data-[checked]:bg-page",
  variants: {
    size: {
      sm: "size-[14px] translate-x-0 data-[checked]:translate-x-4",
      md: "size-4 translate-x-0 data-[checked]:translate-x-[18px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const toggleLabelVariants = tv({
  base: "font-mono text-[12px] leading-none text-muted transition-colors duration-200 ease-out peer-data-[checked]:text-accent-green peer-data-[disabled]:opacity-50",
});

type ToggleSize = NonNullable<VariantProps<typeof toggleRootVariants>["size"]>;

interface ToggleContextValue {
  id: string;
  size: ToggleSize;
}

const ToggleContext = createContext<ToggleContextValue | null>(null);

function useToggleContext() {
  return useContext(ToggleContext);
}

export interface ToggleFieldProps
  extends ComponentPropsWithoutRef<"div">,
    VariantProps<typeof toggleRootVariants> {
  id?: string;
}

export const ToggleField = forwardRef<ElementRef<"div">, ToggleFieldProps>(
  ({ className, id, size = "md", ...props }, ref) => {
    const generatedId = useId();
    const resolvedId = id ?? generatedId;

    return (
      <ToggleContext.Provider value={{ id: resolvedId, size }}>
        <div
          ref={ref}
          className={cn("inline-flex items-center gap-3", className)}
          {...props}
        />
      </ToggleContext.Provider>
    );
  },
);

ToggleField.displayName = "ToggleField";

type TogglePrimitiveProps = Omit<
  ComponentPropsWithoutRef<typeof BaseSwitch.Root>,
  "className"
>;

export interface ToggleRootProps
  extends TogglePrimitiveProps,
    VariantProps<typeof toggleRootVariants> {
  className?: string;
}

export const ToggleRoot = forwardRef<
  ElementRef<typeof BaseSwitch.Root>,
  ToggleRootProps
>(({ className, id, size, ...props }, ref) => {
  const context = useToggleContext();
  const resolvedId = id ?? context?.id;
  const resolvedSize = size ?? context?.size ?? "md";

  return (
    <BaseSwitch.Root
      ref={ref}
      className={toggleRootVariants({ className, size: resolvedSize })}
      id={resolvedId}
      {...props}
    />
  );
});

ToggleRoot.displayName = "ToggleRoot";

export interface ToggleThumbProps
  extends Omit<ComponentPropsWithoutRef<typeof BaseSwitch.Thumb>, "className">,
    VariantProps<typeof toggleThumbVariants> {
  className?: string;
}

export const ToggleThumb = forwardRef<
  ElementRef<typeof BaseSwitch.Thumb>,
  ToggleThumbProps
>(({ className, size, ...props }, ref) => {
  const context = useToggleContext();
  const resolvedSize = size ?? context?.size ?? "md";

  return (
    <BaseSwitch.Thumb
      ref={ref}
      className={toggleThumbVariants({ className, size: resolvedSize })}
      {...props}
    />
  );
});

ToggleThumb.displayName = "ToggleThumb";

export interface ToggleLabelProps extends ComponentPropsWithoutRef<"label"> {}

export const ToggleLabel = forwardRef<ElementRef<"label">, ToggleLabelProps>(
  ({ children, className, htmlFor, ...props }, ref) => {
    const context = useToggleContext();

    return (
      <label
        ref={ref}
        className={toggleLabelVariants({ className })}
        htmlFor={htmlFor ?? context?.id}
        {...props}
      >
        {children}
      </label>
    );
  },
);

ToggleLabel.displayName = "ToggleLabel";
