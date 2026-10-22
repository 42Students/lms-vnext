"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type DeliveryState = {
  status: "PENDING" | "SENT" | "FAILED";
  error: string | null;
  retryable: boolean;
};

export function TpoNoticeDeliveryRetry({ noticeId }: { noticeId: string }) {
  const [state, setState] = useState<DeliveryState | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState("");
  const endpoint = "/api/placements/tpo/announcements/" +
    encodeURIComponent(noticeId) + "/delivery";

  useEffect(() => {
    let active = true;
    setState(null);
    setMessage("");
    void fetch(endpoint, {cache:"no-store"})
      .then(async response => {
        if (!response.ok) throw new Error("Delivery status unavailable");
        return response.json() as Promise<DeliveryState>;
      })
      .then(value => {if (active) setState(value);})
      .catch(() => {if (active) setState(null);});
    return () => {active = false;};
  }, [endpoint]);

  async function retry() {
    if (retrying || !state?.retryable) return;
    setRetrying(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method:"POST",headers:{"Content-Type":"application/json"},body:"{}",
      });
      if (!response.ok) {
        setMessage(response.status === 409
          ? "This notice is not due or has already been delivered. Refresh the page."
          : "The notice is still undelivered. Check the audience and retry.");
        return;
      }
      setState({status:"SENT",error:null,retryable:false});
      setMessage("Delivery retried successfully.");
    } catch {
      setMessage("Couldn't retry delivery. Check your connection and try again.");
    } finally {
      setRetrying(false);
    }
  }

  if (!state?.retryable && !message) return null;
  return <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3" aria-live="polite">
    {state?.retryable ? <>
      <span role="alert" className="text-sm text-danger">
        {state.error ?? "This notice could not be delivered."}
      </span>
      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
        disabled={retrying} loading={retrying} onClick={() => void retry()}>
        Retry delivery
      </Button>
    </> : null}
    {message ? <p role="status" className="m-0 text-sm text-body">{message}</p> : null}
  </div>;
}
