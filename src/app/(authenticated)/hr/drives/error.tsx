"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <section role="alert" className="space-y-3 rounded-lg border border-border bg-surface p-5">
    <h2 className="font-semibold text-foreground">Drives could not load</h2>
    <Button type="button" onClick={reset}>Try again</Button>
  </section>;
}
