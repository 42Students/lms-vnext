"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="border-b border-border py-6">
    <PageHeader title={"Couldn't load placed students"} />
    <p className="mt-2 text-sm text-body">The report failed to load; that is not evidence of zero placed learners.</p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
