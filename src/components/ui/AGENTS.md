# UI Component Patterns

Use these rules for every generic visual component created in `src/components/ui`.

## Core rules

- Use named exports only. Never use `export default`.
- Keep one generic component per file when possible, using kebab-case file names like `button.tsx`.
- Re-export public UI components from `src/components/ui/index.ts`.
- Extend native element props in TypeScript with `ComponentPropsWithoutRef<"tag">`.
- Use `forwardRef` for interactive primitives like `button`, `input`, `textarea`, and links that behave like controls.
- Always set `displayName` after `forwardRef`.
- Use `"use client"` only in wrappers around interactive primitives that require client behavior.
- Prefer composition for multi-part components. If a component has internal sections like label, prefix, content, header, filename, title, or description, split them into subcomponents instead of adding dedicated props for each piece.

## Styling rules

- Use Tailwind classes for styling.
- Prefer Tailwind theme tokens from `src/app/globals.css` instead of hardcoded colors when a token exists.
- Define shared colors in the Tailwind `@theme` block using the `--color-*` namespace so they generate utilities like `bg-accent-green`, `text-foreground`, and `border-border-primary`.
- Use Tailwind's built-in font utilities instead of custom font helper classes.
- Use `font-mono` for monospaced UI text and the default `font-sans` stack for traditional text.
- Use Base UI primitives for reusable components with behavior, such as switches or toggles.
- Prefer APIs like `Toggle.Root`, `Toggle.Label`, `DiffLine.Content`, or `CodeBlock.Filename` over props like `label`, `code`, or `filename` when the component is composed of reusable slots.
- Use `tailwind-variants` for components with visual variants such as size, intent, state, density, or width.
- When using `tailwind-variants`, pass `className` directly to the variant function. Do not wrap the result with `twMerge`.
- Use `tailwind-merge` only when a component is not using `tailwind-variants`, or when a plain utility needs to merge ad-hoc Tailwind class strings.
- Keep server-only UI components, such as Shiki-powered code blocks, out of the main `src/components/ui/index.ts` barrel. Export them from a dedicated server-only entry like `src/components/ui/server.ts`.
- `CodeBlock` must stay server-only and use Shiki with the `vesper` theme.

## Variant pattern

```tsx
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const exampleVariants = tv({
  base: "inline-flex items-center justify-center font-mono",
  variants: {
    variant: {
      primary: "bg-accent-green text-page",
      secondary: "bg-secondary text-foreground",
    },
    size: {
      sm: "px-4 py-2 text-[12px]",
      md: "px-6 py-2.5 text-[13px]",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ExampleProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof exampleVariants> {}

export const Example = forwardRef<ElementRef<"button">, ExampleProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={exampleVariants({ variant, size, className })}
        {...props}
      />
    );
  },
);

Example.displayName = "Example";
```

## Component checklist

- Native props are extended correctly.
- Variants are typed with `VariantProps<typeof componentVariants>`.
- `className` is merged through the `tv()` function, not through `twMerge`.
- The component uses named exports.
- Shared exports are added to `src/components/ui/index.ts`.
- The component passes `pnpm lint` and `pnpm build`.
