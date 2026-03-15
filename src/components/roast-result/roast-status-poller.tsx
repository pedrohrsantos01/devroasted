"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getPollInterval } from "@/components/roast-result/get-poll-interval";
import { Button } from "@/components/ui";

const STALLED_THRESHOLD_MS = 5 * 60_000;

export function RoastStatusPoller({ createdAt }: { createdAt: Date }) {
  const router = useRouter();
  const [isCheckingNow, startCheckingNow] = useTransition();
  const createdAtMs = useMemo(() => new Date(createdAt).getTime(), [createdAt]);
  const [hasReachedStalledThreshold, setHasReachedStalledThreshold] = useState(
    () => Date.now() - createdAtMs >= STALLED_THRESHOLD_MS,
  );

  useEffect(() => {
    if (Date.now() - createdAtMs >= STALLED_THRESHOLD_MS) {
      setHasReachedStalledThreshold(true);

      return;
    }

    const stalledTimeout = window.setTimeout(
      () => {
        setHasReachedStalledThreshold(true);
      },
      Math.max(STALLED_THRESHOLD_MS - (Date.now() - createdAtMs), 0),
    );

    return () => {
      window.clearTimeout(stalledTimeout);
    };
  }, [createdAtMs]);

  useEffect(() => {
    let isCancelled = false;
    let refreshTimeout = 0;

    const scheduleRefresh = () => {
      const elapsedMs = Date.now() - createdAtMs;

      refreshTimeout = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }

        router.refresh();
        scheduleRefresh();
      }, getPollInterval(elapsedMs));
    };

    scheduleRefresh();

    return () => {
      isCancelled = true;
      window.clearTimeout(refreshTimeout);
    };
  }, [createdAtMs, router]);

  if (!hasReachedStalledThreshold) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-4 border border-warning/50 bg-warning/10 px-4 py-4 text-left">
      <p className="font-sans text-[13px] leading-6 text-warning">
        This roast is taking longer than usual. We are still checking for an
        update, but you can refetch the current status right now.
      </p>

      <Button
        className="focus-visible:ring-offset-page"
        disabled={isCheckingNow}
        onClick={() => {
          startCheckingNow(() => {
            router.refresh();
          });
        }}
        size="sm"
        variant="outline"
      >
        $ check_again
      </Button>
    </div>
  );
}
