import { notFound } from "next/navigation";
import { RecruiterRecoveryHarness } from "./recruiter-recovery-harness";
import { featureReady } from "@/config/features";
export const dynamic="force-dynamic";
/** No production or real account access: guarded synthetic recovery fixture. */
export default function RecruiterRecoveryFixture(){
  if(process.env.NODE_ENV!=="development"||!featureReady("e2eAuth"))notFound();
  return <RecruiterRecoveryHarness/>;
}
