"use client";

import { Button } from "@/components/ui/button";

export default function TpoMyNotificationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-border bg-surface px-6 py-10 text-center"
    >
      <h1 className="text-lg font-semibold text-foreground">
        Couldn&apos;t load My Notifications
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Your college-scoped notification records or
        preferences could not be retrieved. This failure
        is not interpreted as an empty inbox or disabled
        notification preferences.
      </p>

      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
