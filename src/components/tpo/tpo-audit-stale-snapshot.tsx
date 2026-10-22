"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Keep only this mounted actor-and-query-bound audit snapshot in memory.
 * The server page supplies a key containing the membership and filters;
 * never retain a private audit record across accounts, roles or searches.
 */
export function TpoAuditStaleSnapshot({
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
        <Alert tone="warning" role="alert"
          title="The audit log refresh failed. Showing the previous rows.">
          <span>Counts and decisions may have changed since the last successful load.</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <TpoAuditRefreshAction />
            <Button type="button" size="sm" variant="secondary"
              className="min-h-11 md:min-h-9"
              aria-label="Dismiss stale audit warning"
              onClick={() => setDismissed(true)}>Dismiss</Button>
          </div>
        </Alert>
      ) : null}
      {failed ? lastGood ?? children : children}
    </>
  );
}

export function TpoAuditRefreshAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" size="sm" variant="secondary"
      className="min-h-11 md:min-h-9" loading={pending} disabled={pending}
      onClick={() => startTransition(() => router.refresh())}>Retry</Button>
  );
}
