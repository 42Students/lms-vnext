import { notFound } from "next/navigation";
import { LearnerAssessmentRecoveryHarness } from "./learner-assessment-recovery-harness";
import { featureReady } from "@/config/features";
export const dynamic="force-dynamic";
export default function LearnerAssessmentRecoveryFixture(){
  if(process.env.NODE_ENV!=="development"||!featureReady("e2eAuth"))notFound();
  return <LearnerAssessmentRecoveryHarness/>;
}
