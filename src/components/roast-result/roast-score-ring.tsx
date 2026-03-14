export interface RoastScoreRingProps {
  score: number;
}

export function RoastScoreRing({ score }: RoastScoreRingProps) {
  return (
    <div className="relative flex size-40 shrink-0 items-center justify-center md:size-[180px]">
      <div className="absolute inset-0 rounded-full border-4 border-border-primary" />
      <div className="absolute inset-[4px] rounded-full bg-[conic-gradient(from_180deg,var(--color-critical)_0deg,var(--color-warning)_126deg,var(--color-accent-green)_360deg)] [-webkit-mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_0)] [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_0)]" />

      <div className="relative flex flex-col items-center justify-center">
        <span className="font-mono text-[40px] font-bold leading-none text-warning md:text-[48px]">
          {score.toFixed(1)}
        </span>
        <span className="mt-2 font-mono text-[14px] text-subtle">/10</span>
      </div>
    </div>
  );
}
