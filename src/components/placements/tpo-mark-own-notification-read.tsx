"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function TpoMarkOwnNotificationRead({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function markRead() {
    if (busy || !window.confirm("Mark this placement notification as read?")) return;
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
    <Button type="button" disabled={busy} onClick={() => void markRead()}
      variant="secondary" className="min-h-11 sm:min-h-9">
      {busy ? "Saving..." : "Mark read"}
    </Button>
    {error ? <p role="alert" className="mt-2 text-xs text-error">{error}</p> : null}
  </div>;
}
