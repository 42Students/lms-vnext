import { PublicJoinPreviewRetry } from "@/components/placements/public-join-preview-retry";
import { PublicRecruiterJoinForm } from "@/components/placements/public-recruiter-join-form";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";
import {publicJoinUnavailable,publicJoinUnavailableCopy} from "@/modules/placements/public-join/readiness-state";

export default async function CompanyJoinPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await getPublicJoinPreview(token, "COMPANY").catch(()=>null);
  if(!preview)return <PublicJoinPreviewRetry token={token} scope="COMPANY"/>;
  // Readiness can fail independently of preview availability. A transient
  // provider/storage error must render a blocked invitation, never a live
  // verification form or an uncaught page exception.
  // Invalid, expired and revoked links have no verification workflow. Avoid
  // probing email/provider readiness (or indicating its state) for these links.
  const readiness=preview.kind==="READY"?
    await publicJoinUnavailable().catch(()=>"RATE_TABLE_MISSING" as const):null;
  const blocked=readiness===null?null:publicJoinUnavailableCopy(readiness);
  return <PublicRecruiterJoinForm token={token} scope="COMPANY" preview={preview} blockedReason={blocked} />;
}
