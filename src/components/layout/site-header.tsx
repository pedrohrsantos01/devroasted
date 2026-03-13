export function SiteHeader() {
  return (
    <header className="w-full border-b border-border-primary bg-page text-foreground-inverse">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-6 md:px-10">
        <div className="inline-flex items-center gap-2 font-mono text-[18px] font-medium leading-none">
          <span className="text-[20px] font-bold text-accent-green">&gt;</span>
          <span>devroast</span>
        </div>

        <span className="font-mono text-[13px] text-muted">leaderboard</span>
      </div>
    </header>
  );
}
