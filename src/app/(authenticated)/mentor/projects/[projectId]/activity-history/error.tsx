"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";


export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Unable to load Mentor project activity history"} />
    <p className="mt-2 text-sm text-body">
      The read failed; an error is not evidence that no records exist.
    </p>
    <Button type="button" variant="secondary" className="mt-3 min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>
      Retry
    </Button>
  </section>;
}
