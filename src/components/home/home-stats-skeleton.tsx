export function HomeStatsSkeleton() {
  return (
    <output
      aria-live="polite"
      className="flex flex-wrap items-center justify-center gap-4 font-sans text-[12px] text-subtle"
    >
      <span className="sr-only">Loading roast stats</span>
      <span className="h-3 w-[128px] animate-pulse rounded-full bg-border-primary" />
      <span className="font-mono">.</span>
      <span className="h-3 w-[112px] animate-pulse rounded-full bg-border-primary" />
    </output>
  );
}
