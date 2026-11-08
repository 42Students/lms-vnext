import { notFound } from "next/navigation";
import { RecruiterRecoveryHarness } from "./recruiter-recovery-harness";
export const dynamic="force-dynamic";
/** No production or real account access: guarded synthetic recovery fixture. */
export default function RecruiterRecoveryFixture(){
  if(process.env.NODE_ENV!=="development"||process.env.E2E_AUTH_ENABLED!=="true")notFound();
  return <RecruiterRecoveryHarness/>;
}
