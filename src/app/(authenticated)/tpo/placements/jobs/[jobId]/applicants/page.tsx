import { redirect } from "next/navigation";

/**
 * The drive tab strip links "Applicants" here, but the applicant list lives on
 * the pipeline page; without this the tab 404ed (acceptance pass 6).
 */
export default async function TpoDriveApplicantsRedirect({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  redirect(`/tpo/placements/jobs/${encodeURIComponent(jobId)}/applicants-pipeline`);
}
