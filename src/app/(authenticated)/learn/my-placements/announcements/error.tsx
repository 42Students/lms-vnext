"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Announcements unavailable"} />
    <p className="mt-2 text-sm text-body">Your notices could not be loaded. No missing announcements were inferred.</p>
    <Button type="button" onClick={reset} className="mt-4 max-md:min-h-11">Retry</Button>
  </section>;
}
