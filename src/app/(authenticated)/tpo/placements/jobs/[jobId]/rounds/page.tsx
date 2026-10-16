import { redirect } from "next/navigation";

/**
 * The drive tab strip links "Rounds" here, but rounds are managed from the
 * drive overview (round results are the only nested route); without this the
 * tab 404ed (acceptance pass 6).
 */
export default async function TpoDriveRoundsRedirect({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  redirect(`/tpo/placements/jobs/${encodeURIComponent(jobId)}`);
}
