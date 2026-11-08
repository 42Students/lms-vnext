"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { recruiterDriveMessageHref } from "@/modules/placements/recruiter-drive-navigation";
import G081ChangeError from "@/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error";
import G081ChangeLoading from "@/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading";
import G082ProfileError from "@/app/(authenticated)/recruiter/profile/error";
import G082ProposalsLoading from "@/app/(authenticated)/recruiter/drives/proposals/loading";
const id="123e4567-e89b-42d3-a456-426614174000";
export function RecruiterDriveRecoveryHarness(){
 const [attempts,setAttempts]=useState(0);
 return <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
   <PageHeader title="Recruiter drive journeys" description="UI-only fixture; no real recruiter data." />
   <section role="region" aria-label="Drive discussion continuity" className="space-y-2">
     <TextLink href={recruiterDriveMessageHref(id)}>Discussion and messages</TextLink>
     <p>Selected drive: {id}</p>
   </section>
   <section role="region" aria-label="Recruiter drive retry" className="space-y-3">
     <G081ChangeError error={new Error("SENSITIVE_SOURCE_DO_NOT_DISPLAY")} reset={()=>setAttempts(n=>n+1)} />
     <p data-testid="recruiter-drive-retries" role="status">Retry attempts: {attempts}</p>
   </section>
   <section role="region" aria-label="Recruiter profile retry">
     <G082ProfileError error={new Error("SENSITIVE_SOURCE_DO_NOT_DISPLAY")} reset={()=>setAttempts(n=>n+1)} />
   </section>
   <section role="region" aria-label="Recruiter journey loading" className="space-y-3">
     <G081ChangeLoading/><G082ProposalsLoading/>
   </section>
 </main>;
}
