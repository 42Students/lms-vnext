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

  useEffect(() => {
    if (!failed) setLastGood(children);
  }, [children, failed]);

  return (
    <>
      {failed && lastGood ? (
        <Alert tone="warning">
          Drive refresh failed. Showing the last successfully loaded drives for this
          college and filter selection. Counts and statuses may be out of date.
          <span className="ml-2 inline-flex">
            <TpoLifecycleRefreshAction label="Retry" />
          </span>
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
