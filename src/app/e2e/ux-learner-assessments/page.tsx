import { notFound } from "next/navigation";
import { LearnerAssessmentRecoveryHarness } from "./learner-assessment-recovery-harness";
export const dynamic="force-dynamic";
export default function LearnerAssessmentRecoveryFixture(){
  if(process.env.NODE_ENV!=="development"||process.env.E2E_AUTH_ENABLED!=="true")notFound();
  return <LearnerAssessmentRecoveryHarness/>;
}
