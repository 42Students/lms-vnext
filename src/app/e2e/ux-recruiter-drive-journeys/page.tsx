import { notFound } from "next/navigation";
import { RecruiterDriveRecoveryHarness } from "./recruiter-drive-recovery-harness";
import { featureReady } from "@/config/features";
export const dynamic="force-dynamic";
/** Synthetic recovery UI: no live recruiter's grants or database access. */
export default function RecruiterDriveRecoveryFixture(){
 if(process.env.NODE_ENV!=="development"||!featureReady("e2eAuth"))notFound();
 return <RecruiterDriveRecoveryHarness/>;
}
