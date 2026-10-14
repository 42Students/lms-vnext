"use client";
import { Button } from "@/components/ui/button";
export default function TpoNotificationsError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
    <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t load my placement notifications</h1>
    <p className="mt-2 text-sm text-body">
      Delivery records could not be retrieved. A failure is not an empty inbox.
    </p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
