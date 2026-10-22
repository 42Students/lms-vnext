"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * The old learner placement announcements page acknowledged notifications
 * when the list was opened. Only acknowledge actually delivered, persisted
 * notification IDs from the *visible* membership-scoped page; the mutation
 * endpoint independently checks learner ownership and same-origin requests.
 * A failure never assumes a receipt was read or clears the unread count.
 */
export function LearnerNoticeReadOnView({
  notificationIds,
}: {
  notificationIds: readonly string[];
}) {
  const router = useRouter();
  const attempted = useRef<string | null>(null);
  const receiptRef=useRef(false);
  const activeReceiptKey=useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = [...new Set(notificationIds)].sort().join(",");

  useEffect(() => {
    const attemptKey = key + ":" + retry;
    if(receiptRef.current && activeReceiptKey.current===attemptKey)return;
    if (attempted.current === attemptKey) return;
    attempted.current = attemptKey;
    activeReceiptKey.current=attemptKey;
    receiptRef.current = true;
    let cancelled = false;
    const ids = key ? key.split(",") : [];
    async function acknowledge() {
      try {
      if (!ids.length) {
        window.dispatchEvent(new CustomEvent("placement-announcements-read"));
        return;
      }
      // Bound writes to only the 15 currently displayed items. Do not batch
      // across unloaded pages or acknowledge notices without a receipt.
      const results = await Promise.allSettled(ids.map(async id => {
        const response = await fetch(
          "/api/notifications/" + encodeURIComponent(id) + "/read",
          { method: "POST", credentials: "same-origin", cache: "no-store" },
        );
        if (!response.ok) throw new Error("Read receipt was not saved");
      }));
      if (cancelled) return;
      const anySuccess = results.some(result => result.status === "fulfilled");
      const anyFailure = results.some(result => result.status === "rejected");
      setFailed(anyFailure);
      if (anySuccess) {
        window.dispatchEvent(new CustomEvent("placement-announcements-read"));
        router.refresh();
      }
      }finally{if(activeReceiptKey.current===attemptKey)receiptRef.current = false;}
    }
    void acknowledge();
    return () => { cancelled = true; };
  }, [key, retry, router]);

  return failed ? (
    <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-body">
      Some announcement read receipts could not be saved. The unread count remains authoritative.
      <Button type="button" variant="secondary" size="sm"
        onClick={() => { setFailed(false); setRetry(value => value + 1); }}>
        Retry marking these notices read
      </Button>
    </div>
  ) : null;
}
