import { PublicRecruiterJoinForm } from "@/components/placements/public-recruiter-join-form";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";

export default async function CompanyJoinPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await getPublicJoinPreview(token, "COMPANY");
  return <PublicRecruiterJoinForm token={token} scope="COMPANY" preview={preview} />;
}
