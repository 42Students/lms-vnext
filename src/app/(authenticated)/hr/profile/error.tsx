"use client";
import { TextLink } from "@/components/ui/text-link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RecruiterProfileError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <div className="min-w-0 max-w-2xl space-y-4 md:space-y-6">
  <PageHeader title="Couldn't load your recruiter profile"/>
  <ErrorState title="Recruiter profile unavailable"
   description="Your account or college access details could not be retrieved. No access status or grant date is inferred from a failed database read."
   action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><TextLink href="/hr/home" className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">Back to recruiter home</TextLink></span>}/>
 </div>;
}
