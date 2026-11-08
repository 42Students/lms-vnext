"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import RecruiterNotFound from "@/app/(authenticated)/recruiter/not-found";
import RecruiterDrivesLoading from "@/app/(authenticated)/recruiter/drives/loading";
import RecruiterCollegesLoading from "@/app/(authenticated)/recruiter/colleges/loading";
import RecruiterCalendarLoading from "@/app/(authenticated)/recruiter/calendar/loading";
import RecruiterError from "@/app/(authenticated)/recruiter/drives/error";
export function RecruiterRecoveryHarness(){
  const [retry,setRetry]=useState(0);
  return <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <section aria-label="Recruiter not found" role="region"><RecruiterNotFound /></section>
    <section aria-label="Recruiter loading examples" role="region" className="grid gap-3 md:grid-cols-3">
      <RecruiterCollegesLoading/><RecruiterCalendarLoading/><RecruiterDrivesLoading/>
    </section>
    <section aria-label="Recruiter safe recovery" role="region">
      <RecruiterError error={new Error("SECRET_PROVIDER_ERROR")} reset={()=>setRetry(x=>x+1)} />
      <p data-testid="recruiter-retry-count" role="status">Retry attempts: {retry}</p>
      <Button variant="secondary" type="button" onClick={()=>setRetry(0)}>Reset synthetic counter</Button>
    </section>
  </main>;
}
