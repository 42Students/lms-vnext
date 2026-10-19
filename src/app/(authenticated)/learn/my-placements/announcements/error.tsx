"use client";
import {Button} from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main role="alert" className="py-5">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Announcements unavailable</h1>
    <p className="mt-2 text-sm text-body">Your notices could not be loaded. No missing announcements were inferred.</p>
    <Button type="button" onClick={reset} className="mt-4">Retry</Button>
  </main>;
}
