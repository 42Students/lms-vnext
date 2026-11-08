"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";


export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <section role="alert" className="border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
    <PageHeader title={"Unable to load Mentor project activity history"} />
    <p className="mt-2 text-sm text-body">
      The read failed; an error is not evidence that no records exist.
    </p>
    <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>
        Retry activity
      </Button>
      <TextLink href="/mentor/projects" className="inline-flex min-h-11 items-center justify-center sm:w-auto md:min-h-9">My projects</TextLink>
    </div>
  </section>;
}
