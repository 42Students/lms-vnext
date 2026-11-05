"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Find a student, recruiter or company" />
  <ErrorState title="Could not load this page" description="Record search is unavailable."
   action={<><Button variant="secondary" type="button" onClick={reset}>Retry</Button>
    <TextLink href="/tpo/home" className="inline-flex min-h-11 items-center md:min-h-9">TPO home</TextLink></>}
  />
 </div>;
}
