"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Follow-ups due" />
  <ErrorState title="Couldn't load recruiter follow-ups" description="Follow-up data could not be retrieved. Missing data is not treated as zero."
   action={<><Button variant="secondary" type="button" onClick={reset}>Retry</Button>
    <TextLink href="/tpo/recruiters" className="inline-flex min-h-11 items-center md:min-h-9">← Back to recruiter leads</TextLink></>}/>
 </div>;
}
