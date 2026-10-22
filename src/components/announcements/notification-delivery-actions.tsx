"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const responseSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

type Action = "resend" | "cancel-schedule";

export function NotificationDeliveryActions({
  id, collegeId, deliveryStatus,
}: {
  id: string;
  collegeId: string;
  deliveryStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const available: Array<{ action: Action; label: string }> =
    deliveryStatus === "SCHEDULED"
      ? [{ action: "resend", label: "Send now" },
         { action: "cancel-schedule", label: "Cancel schedule" }]
      : deliveryStatus === "FAILED"
        ? [{ action: "resend", label: "Retry delivery" }]
        : [];

  async function submit(action: Action) {
    if (busy) return;
    const question = action === "cancel-schedule"
      ? "Cancel this pending notification schedule?"
      : "Queue this notification for immediate delivery?";
    if (!window.confirm(question)) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(
        "/api/admin/notification-delivery/" + encodeURIComponent(id) +
        "/" + action + "?collegeId=" + encodeURIComponent(collegeId),
        { method: "POST", credentials: "same-origin" },
      );
      const body: unknown = await response.json();
      const parsed = responseSchema.safeParse(body);
      if (!response.ok) {
        setFeedback(parsed.success
          ? parsed.data.message ?? parsed.data.error ?? "Delivery operation failed."
          : "Delivery operation failed. Retry or contact an administrator.");
        return;
      }
      setFeedback(parsed.success
        ? parsed.data.message ?? "Delivery updated."
        : "Delivery updated.");
      router.refresh();
    } catch {
      setFeedback("Could not reach the delivery service. Retry this action.");
    } finally {
      setBusy(false);
    }
  }

  if (available.length === 0) return null;
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {available.map(({ action, label }) => (
        <button key={action} type="button" disabled={busy}
          onClick={() => void submit(action)}
          className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text disabled:opacity-50">
          {busy ? "Updating…" : label}
        </button>
      ))}
    </div>
    {feedback ? <p role="status" aria-live="polite" className="text-sm">{feedback}</p> : null}
  </div>;
}
