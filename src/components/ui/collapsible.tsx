"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { tv } from "tailwind-variants";

export const collapsibleRootVariants = tv({
  base: "w-full",
});

export const collapsibleTriggerVariants = tv({
  base: "group inline-flex items-center gap-2 rounded-md outline-none transition duration-200 ease-out focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50",
});

export const collapsiblePanelVariants = tv({
  base: "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 [&[hidden]:not([hidden='until-found'])]:hidden",
});

type CollapsibleRootPrimitiveProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCollapsible.Root>,
  "className"
>;

export interface CollapsibleRootProps extends CollapsibleRootPrimitiveProps {
  className?: string;
}

export const CollapsibleRoot = forwardRef<
  ElementRef<typeof BaseCollapsible.Root>,
  CollapsibleRootProps
>(({ className, ...props }, ref) => {
  return (
    <BaseCollapsible.Root
      className={collapsibleRootVariants({ className })}
      ref={ref}
      {...props}
    />
  );
});

CollapsibleRoot.displayName = "CollapsibleRoot";

type CollapsibleTriggerPrimitiveProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCollapsible.Trigger>,
  "className"
>;

export interface CollapsibleTriggerProps
  extends CollapsibleTriggerPrimitiveProps {
  className?: string;
}

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof BaseCollapsible.Trigger>,
  CollapsibleTriggerProps
>(({ className, ...props }, ref) => {
  return (
    <BaseCollapsible.Trigger
      className={collapsibleTriggerVariants({ className })}
      ref={ref}
      {...props}
    />
  );
});

CollapsibleTrigger.displayName = "CollapsibleTrigger";

type CollapsiblePanelPrimitiveProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCollapsible.Panel>,
  "className"
>;

export interface CollapsiblePanelProps extends CollapsiblePanelPrimitiveProps {
  className?: string;
}

export const CollapsiblePanel = forwardRef<
  ElementRef<typeof BaseCollapsible.Panel>,
  CollapsiblePanelProps
>(({ className, ...props }, ref) => {
  return (
    <BaseCollapsible.Panel
      className={collapsiblePanelVariants({ className })}
      ref={ref}
      {...props}
    />
  );
});

CollapsiblePanel.displayName = "CollapsiblePanel";

export const Collapsible = {
  Panel: CollapsiblePanel,
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
};
