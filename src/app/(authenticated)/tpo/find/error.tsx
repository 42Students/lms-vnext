"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Find a student, recruiter or company" />
  <ErrorState title="Could not load this page" description="Record search is unavailable."
   action={<><Button variant="secondary" type="button" onClick={reset}>Retry</Button>
    <Link href="/tpo/home" className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">TPO home</Link></>}
  />
 </div>;
}
