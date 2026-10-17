import { PublicJoinPreviewRetry } from "@/components/placements/public-join-preview-retry";
import { PublicRecruiterJoinForm } from "@/components/placements/public-recruiter-join-form";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";
import {publicJoinUnavailable,publicJoinUnavailableCopy} from "@/modules/placements/public-join/readiness-state";

export default async function CollegeJoinPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await getPublicJoinPreview(token, "COLLEGE").catch(()=>null);
  if(!preview)return <PublicJoinPreviewRetry token={token} scope="COLLEGE"/>;
  const blocked=publicJoinUnavailableCopy(await publicJoinUnavailable());
  return <PublicRecruiterJoinForm token={token} scope="COLLEGE" preview={preview} blockedReason={blocked} />;
}
