import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface ShowcaseSectionRootProps
  extends ComponentPropsWithoutRef<"article"> {}

export function ShowcaseSectionRoot({
  className,
  ...props
}: ShowcaseSectionRootProps) {
  return (
    <article
      className={cn(
        "rounded-[24px] border border-border-primary bg-white p-6 shadow-[0_16px_48px_rgba(17,17,17,0.06)] sm:p-8",
        className,
      )}
      {...props}
    />
  );
}

export interface ShowcaseSectionHeaderProps
  extends ComponentPropsWithoutRef<"div"> {}

export function ShowcaseSectionHeader({
  className,
  ...props
}: ShowcaseSectionHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-2", className)} {...props} />
  );
}

export interface ShowcaseSectionEyebrowProps
  extends ComponentPropsWithoutRef<"p"> {}

export function ShowcaseSectionEyebrow({
  className,
  ...props
}: ShowcaseSectionEyebrowProps) {
  return (
    <p
      className={cn(
        "font-mono text-[12px] uppercase tracking-[0.24em] text-accent-green",
        className,
      )}
      {...props}
    />
  );
}

export interface ShowcaseSectionTitleProps
  extends ComponentPropsWithoutRef<"h2"> {}

export function ShowcaseSectionTitle({
  className,
  ...props
}: ShowcaseSectionTitleProps) {
  return (
    <h2
      className={cn(
        "font-sans text-2xl font-semibold tracking-[-0.03em]",
        className,
      )}
      {...props}
    />
  );
}

export interface ShowcaseSectionDescriptionProps
  extends ComponentPropsWithoutRef<"p"> {}

export function ShowcaseSectionDescription({
  className,
  ...props
}: ShowcaseSectionDescriptionProps) {
  return (
    <p
      className={cn(
        "max-w-2xl font-sans text-sm leading-6 text-black/56",
        className,
      )}
      {...props}
    />
  );
}

export interface ShowcaseSectionBodyProps
  extends ComponentPropsWithoutRef<"div"> {}

export function ShowcaseSectionBody({
  className,
  ...props
}: ShowcaseSectionBodyProps) {
  return <div className={cn(className)} {...props} />;
}

export const ShowcaseSection = {
  Body: ShowcaseSectionBody,
  Description: ShowcaseSectionDescription,
  Eyebrow: ShowcaseSectionEyebrow,
  Header: ShowcaseSectionHeader,
  Root: ShowcaseSectionRoot,
  Title: ShowcaseSectionTitle,
};
