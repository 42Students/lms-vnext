"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Retain only the currently mounted college-membership + filter snapshot.
 * The caller must key this boundary by membership and every list filter:
 * switching college, role, or view remounts it rather than leaking old rows.
 * No persisted browser storage and no server-process-wide data cache.
 */
export function TpoLifecycleStaleSnapshot({
  children,
  failed,
}: {
  children: ReactNode;
  failed: boolean;
}) {
  const [lastGood, setLastGood] = useState<ReactNode>(failed ? null : children);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!failed) {
      setLastGood(children);
      setDismissed(false);
    }
  }, [children, failed]);

  return (
    <>
      {failed && lastGood && !dismissed ? (
        <Alert tone="error" title="This refresh failed. Drives below are from the last successful load.">
          <span>Counts and statuses may be out of date until the next successful refresh.</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <TpoLifecycleRefreshAction label="Retry" />
            <Button type="button" size="sm" variant="secondary" onClick={() => setDismissed(true)}
              aria-label="Dismiss stale drives warning">Dismiss</Button>
          </div>
        </Alert>
      ) : null}
      {failed ? lastGood ?? children : children}
    </>
  );
}

/** Refresh the server list without a full-document navigation that would
 * discard the last good snapshot before an outage can be reported. */
export function TpoLifecycleRefreshAction({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" variant="secondary" loading={pending} disabled={pending}
      className="min-h-11 w-full sm:w-auto md:min-h-9"
      onClick={() => startTransition(() => router.refresh())}>
      {label}
    </Button>
  );
}
