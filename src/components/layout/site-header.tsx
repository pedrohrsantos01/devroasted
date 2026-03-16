import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-border-primary bg-page text-foreground-inverse">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-6 md:px-10">
        <Link
          className="inline-flex items-center gap-2 rounded-sm font-mono text-[18px] font-medium leading-none transition duration-200 ease-out hover:text-foreground-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          href="/"
        >
          <span className="text-[20px] font-bold text-accent-green">&gt;</span>
          <span>devroast</span>
        </Link>

        <Link
          className="rounded-sm px-1 py-0.5 font-mono text-[13px] text-muted transition duration-200 ease-out hover:text-foreground-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          href="/leaderboard"
        >
          leaderboard
        </Link>
      </div>
    </header>
  );
}
