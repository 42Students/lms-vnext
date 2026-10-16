import { PublicRecruiterJoinForm } from "@/components/placements/public-recruiter-join-form";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";

export default async function CollegeJoinPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await getPublicJoinPreview(token, "COLLEGE");
  return <PublicRecruiterJoinForm token={token} scope="COLLEGE" preview={preview} />;
}
