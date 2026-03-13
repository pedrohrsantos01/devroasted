import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface LeaderboardTableRootProps
  extends ComponentPropsWithoutRef<"div"> {}

export function LeaderboardTableRoot({
  className,
  ...props
}: LeaderboardTableRootProps) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-border-primary bg-page",
        className,
      )}
      {...props}
    />
  );
}

export interface LeaderboardTableHeadProps
  extends ComponentPropsWithoutRef<"div"> {}

export function LeaderboardTableHead({
  className,
  ...props
}: LeaderboardTableHeadProps) {
  return (
    <div
      className={cn(
        "grid h-10 grid-cols-[50px_70px_minmax(0,1fr)_100px] items-center gap-4 border-b border-border-primary bg-surface px-5 font-mono text-[12px] font-medium text-subtle",
        className,
      )}
      {...props}
    />
  );
}

export interface LeaderboardTableHeadCellProps
  extends ComponentPropsWithoutRef<"span"> {}

export function LeaderboardTableHeadCell({
  className,
  ...props
}: LeaderboardTableHeadCellProps) {
  return <span className={cn(className)} {...props} />;
}

export interface LeaderboardTableBodyProps
  extends ComponentPropsWithoutRef<"div"> {}

export function LeaderboardTableBody({
  className,
  ...props
}: LeaderboardTableBodyProps) {
  return <div className={cn(className)} {...props} />;
}

export interface LeaderboardTableRowProps
  extends ComponentPropsWithoutRef<"div"> {}

export function LeaderboardTableRow({
  className,
  ...props
}: LeaderboardTableRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[50px_70px_minmax(0,1fr)_100px] gap-4 px-5 py-4 text-[12px]",
        className,
      )}
      {...props}
    />
  );
}

export interface LeaderboardTableCellProps
  extends ComponentPropsWithoutRef<"div"> {}

export function LeaderboardTableCell({
  className,
  ...props
}: LeaderboardTableCellProps) {
  return <div className={cn(className)} {...props} />;
}

export interface LeaderboardTableFooterProps
  extends ComponentPropsWithoutRef<"div"> {}

export function LeaderboardTableFooter({
  className,
  ...props
}: LeaderboardTableFooterProps) {
  return (
    <div
      className={cn(
        "px-5 py-4 text-center font-sans text-[12px] text-subtle",
        className,
      )}
      {...props}
    />
  );
}

export const LeaderboardTable = {
  Body: LeaderboardTableBody,
  Cell: LeaderboardTableCell,
  Footer: LeaderboardTableFooter,
  Head: LeaderboardTableHead,
  HeadCell: LeaderboardTableHeadCell,
  Root: LeaderboardTableRoot,
  Row: LeaderboardTableRow,
};
