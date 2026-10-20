"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
export function TpoMarkOwnNotificationRead({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function markRead() {
    if (busy) return;
    setConfirmOpen(false);
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/placements/tpo/messages/notifications/read", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, confirmed: true, expectedUnread: true }),
      });
      if (!response.ok) throw new Error("Notification already changed or inaccessible. Refresh before retrying.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not mark notification read.");
    } finally { setBusy(false); }
  }
  return <div>
    <Button type="button" disabled={busy} onClick={() => setConfirmOpen(true)}
      variant="secondary" className="min-h-11 md:min-h-9">
      {busy ? "Saving..." : "Mark read"}
    </Button>
    {error ? <InlineNotice tone="error" message={error}/> : null}
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
      title="Mark placement notification as read?"
      description="Mark this placement notification as read?"
      confirmLabel="Mark read" confirmVariant="primary"
      pending={busy} onConfirm={() => void markRead()}/>
  </div>;
}
