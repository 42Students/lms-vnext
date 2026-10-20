"use client";
import { Alert } from "@/components/ui/alert";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RecruiterProfileError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <>
  <PageHeader title="Couldn't load your recruiter profile"/>
  <ErrorState title="Recruiter profile unavailable"
   description="Your account or college access details could not be retrieved. No access status or grant date is inferred from a failed database read."
   action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>
 </>;
}
