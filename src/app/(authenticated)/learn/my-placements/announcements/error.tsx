"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main role="alert" className="py-5">
    <PageHeader title={"Announcements unavailable"} />
    <p className="mt-2 text-sm text-body">Your notices could not be loaded. No missing announcements were inferred.</p>
    <Button type="button" onClick={reset} className="mt-4">Retry</Button>
  </main>;
}
