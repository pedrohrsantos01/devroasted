import {
  Children,
  type ComponentPropsWithoutRef,
  cloneElement,
  type ElementRef,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const diffLineRootVariants = tv({
  base: "flex w-full items-center gap-2 px-4 py-2 font-mono text-[13px] leading-none",
  variants: {
    variant: {
      added: "bg-diff-added",
      removed: "bg-diff-removed",
      context: "bg-transparent",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

export const diffLinePrefixVariants = tv({
  base: "w-3 shrink-0",
  variants: {
    variant: {
      added: "text-accent-green",
      removed: "text-critical",
      context: "text-subtle",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

export const diffLineContentVariants = tv({
  base: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
  variants: {
    variant: {
      added: "text-foreground-inverse",
      removed: "text-muted",
      context: "text-muted",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

type DiffLineVariant = NonNullable<
  VariantProps<typeof diffLineRootVariants>["variant"]
>;

const diffPrefixes = {
  added: "+",
  context: " ",
  removed: "-",
} as const;

function applyVariantToChildren(children: ReactNode, variant: DiffLineVariant) {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const typedChild = child as ReactElement<{ variant?: DiffLineVariant }>;

    return cloneElement(typedChild, {
      variant: typedChild.props.variant ?? variant,
    });
  });
}

export interface DiffLineRootProps
  extends ComponentPropsWithoutRef<"div">,
    VariantProps<typeof diffLineRootVariants> {}

export const DiffLineRoot = forwardRef<ElementRef<"div">, DiffLineRootProps>(
  ({ children, className, variant = "context", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={diffLineRootVariants({ className, variant })}
        {...props}
      >
        {applyVariantToChildren(children, variant)}
      </div>
    );
  },
);

DiffLineRoot.displayName = "DiffLineRoot";

export interface DiffLinePrefixProps
  extends ComponentPropsWithoutRef<"span">,
    VariantProps<typeof diffLinePrefixVariants> {}

export const DiffLinePrefix = forwardRef<
  ElementRef<"span">,
  DiffLinePrefixProps
>(({ children, className, variant = "context", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={diffLinePrefixVariants({ className, variant })}
      {...props}
    >
      {children ?? diffPrefixes[variant]}
    </span>
  );
});

DiffLinePrefix.displayName = "DiffLinePrefix";

export interface DiffLineContentProps
  extends ComponentPropsWithoutRef<"span">,
    VariantProps<typeof diffLineContentVariants> {}

export const DiffLineContent = forwardRef<
  ElementRef<"span">,
  DiffLineContentProps
>(({ className, variant = "context", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={diffLineContentVariants({ className, variant })}
      {...props}
    />
  );
});

DiffLineContent.displayName = "DiffLineContent";

export const DiffLine = {
  Content: DiffLineContent,
  Prefix: DiffLinePrefix,
  Root: DiffLineRoot,
};
