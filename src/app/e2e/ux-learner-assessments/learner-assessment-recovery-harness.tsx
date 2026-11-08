"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import AssignmentLoading from "@/app/(authenticated)/learn/allAssignments/loading";
import QuizLoading from "@/app/(authenticated)/learn/allQuizzes/loading";
import AssignmentError from "@/app/(authenticated)/learn/allAssignments/error";
import QuizDetailError from "@/app/(authenticated)/learn/allQuizzes/[quizId]/error";
import {learnerAssignmentListHref,learnerAssignmentListRecoveryPage} from
  "@/modules/courses/learner-assignment-page-model";
import { TextLink } from "@/components/ui/text-link";

export function LearnerAssessmentRecoveryHarness(){
  const [attempts,setAttempts]=useState(0);
  const course="123e4567-e89b-42d3-a456-426614174000";
  const next=learnerAssignmentListRecoveryPage(8,21);
  return <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <PageHeader title="Learner assessment recovery" description="Synthetic UI; no learner records." />
    <section role="region" aria-label="Assessment page recovery" className="space-y-3">
      <AssignmentError error={new Error("PRIVATE_ERROR_DO_NOT_DISPLAY")} reset={()=>setAttempts(n=>n+1)} />
      <p data-testid="learner-retry-count" role="status">Retry attempts: {attempts}</p>
      <QuizDetailError error={new Error("PRIVATE_ERROR_DO_NOT_DISPLAY")} reset={()=>setAttempts(n=>n+1)} />
    </section>
    <section role="region" aria-label="Assessment loading states" className="space-y-4">
      <AssignmentLoading /><QuizLoading />
    </section>
    <section role="region" aria-label="Stale filtered page recovery" className="space-y-2">
      <p>Requested page: 8 · Actual last page: {next}</p>
      <TextLink href={learnerAssignmentListHref(next??1,course)}>Return to last authorized page</TextLink>
    </section>
  </main>;
}
