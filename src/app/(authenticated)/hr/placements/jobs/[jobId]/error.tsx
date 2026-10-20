"use client";

import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Button } from "@/components/ui/button";

export default function HrJobError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}){
 return <>
  <PageHeader title="Drive details could not load" />
  <ErrorState title="Drive details unavailable"
   description="Some drive information may be stale or unavailable. We couldn't verify this drive right now. No applicant or offer details are shown until the employer and college access check succeeds."
   action={<>
    <Button onClick={reset}>Retry drive details</Button>
    <PageBackLink href="/hr/drives" label="Back to Drives"/>
   </>}
  />
 </>;
}
