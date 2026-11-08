import { notFound } from "next/navigation";
import { RecruiterDriveRecoveryHarness } from "./recruiter-drive-recovery-harness";
export const dynamic="force-dynamic";
/** Synthetic recovery UI: no live recruiter's grants or database access. */
export default function RecruiterDriveRecoveryFixture(){
 if(process.env.NODE_ENV!=="development"||process.env.E2E_AUTH_ENABLED!=="true")notFound();
 return <RecruiterDriveRecoveryHarness/>;
}
