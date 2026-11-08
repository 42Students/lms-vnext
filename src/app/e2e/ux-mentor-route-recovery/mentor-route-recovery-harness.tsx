"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MentorProjectFilterError } from "@/components/projects/mentor-project-filter-error";
import MentorNotificationsError from "@/app/(authenticated)/mentor/notifications/error";
import MentorNotificationsLoading from "@/app/(authenticated)/mentor/notifications/loading";
import MentorBoardError from "@/app/(authenticated)/mentor/projects/[projectId]/board-review/error";
const projectId="123e4567-e89b-42d3-a456-426614174000";
export function MentorRouteRecoveryHarness(){
  const [attempts,setAttempts]=useState(0);
  return <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <PageHeader title="Mentor route recovery" description="Synthetic fixtures; no live projects." />
    <section role="region" aria-label="Mentor board filters">
      <MentorProjectFilterError projectId={projectId} kind="board" />
    </section>
    <section role="region" aria-label="Mentor activity filters">
      <MentorProjectFilterError projectId={projectId} kind="activity" />
    </section>
    <section role="region" aria-label="Mentor notifications failed" className="space-y-3">
      <MentorNotificationsError error={new Error("PRIVATE_PROVIDER_FAILURE")} reset={()=>setAttempts(n=>n+1)} />
      <p data-testid="mentor-retry-count" role="status">Retry attempts: {attempts}</p>
    </section>
    <section role="region" aria-label="Mentor board failed">
      <MentorBoardError error={new Error("PRIVATE_PROVIDER_FAILURE")} reset={()=>setAttempts(n=>n+1)} />
    </section>
    <section role="region" aria-label="Mentor loading state">
      <MentorNotificationsLoading />
    </section>
  </main>;
}
