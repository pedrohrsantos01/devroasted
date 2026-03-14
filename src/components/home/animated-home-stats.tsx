"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

import { HomeStatsSkeleton } from "@/components/home/home-stats-skeleton";

interface AnimatedHomeStatsProps {
  averageScore: number;
  totalRoastedCodes: number;
}

export function AnimatedHomeStats({
  averageScore,
  totalRoastedCodes,
}: AnimatedHomeStatsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    averageScore: 0,
    totalRoastedCodes: 0,
  });

  useEffect(() => {
    setIsMounted(true);
    setAnimatedValues({
      averageScore: 0,
      totalRoastedCodes: 0,
    });

    const animationFrame = window.requestAnimationFrame(() => {
      setAnimatedValues({
        averageScore,
        totalRoastedCodes,
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [averageScore, totalRoastedCodes]);

  if (!isMounted) {
    return <HomeStatsSkeleton />;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 font-sans text-[12px] text-subtle">
      <span className="inline-flex items-center gap-1.5">
        <NumberFlow
          className="font-mono tabular-nums text-foreground-inverse"
          locales="en-US"
          value={animatedValues.totalRoastedCodes}
          willChange
        />
        <span>codes roasted</span>
      </span>

      <span className="font-mono">.</span>

      <span className="inline-flex items-center gap-1.5">
        <span>avg score:</span>
        <NumberFlow
          className="font-mono tabular-nums text-foreground-inverse"
          format={{
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          }}
          locales="en-US"
          value={animatedValues.averageScore}
          willChange
        />
        <span className="font-mono text-foreground-inverse">/10</span>
      </span>
    </div>
  );
}
