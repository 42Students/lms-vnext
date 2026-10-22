"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {Button} from "@/components/ui/button";

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
  const [pending, setPending] = useState<Action | null>(null);
  const available: Array<{ action: Action; label: string }> =
    deliveryStatus === "SCHEDULED"
      ? [{ action: "resend", label: "Send now" },
         { action: "cancel-schedule", label: "Cancel schedule" }]
      : deliveryStatus === "FAILED"
        ? [{ action: "resend", label: "Retry delivery" }]
        : [];

  const question = pending === "cancel-schedule"
    ? "Cancel this pending notification schedule?"
    : "Queue this notification for immediate delivery?";

  async function submit(action: Action) {
    if (busy) return;
    setPending(null);
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
        <Button variant="secondary" key={action} type="button" disabled={busy}
          onClick={() => { setFeedback(null); setPending(action); }}
          >
          {busy ? "Updating…" : label}
        </Button>
      ))}
    </div>
    {pending ? <div role="alertdialog" aria-label="Confirm delivery change" className="space-y-2 text-sm">
      <p>{question}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void submit(pending)}>Confirm</Button>
        <Button variant="secondary" type="button" disabled={busy} onClick={() => setPending(null)}>Keep as is</Button>
      </div>
    </div> : null}
    {feedback ? <p role="status" aria-live="polite" className="text-sm">{feedback}</p> : null}
  </div>;
}
