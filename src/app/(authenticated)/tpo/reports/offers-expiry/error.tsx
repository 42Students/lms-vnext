"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="border-b border-border py-6">
    <PageHeader title={"Couldn't load expiry watchlist"} />
    <p className="mt-2 text-sm text-body">
      Expiry records could not be loaded. This is not evidence that no offers are expiring.
    </p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
