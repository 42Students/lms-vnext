import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listLearnerPlacementJobs } from "@/modules/placements/learner-job-service";
import { createPrivateReadGrant } from "@/modules/storage/private-object-storage";
import { placementJobIdSchema } from "@/modules/placements/validation";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
type Params = { params: Promise<{ jobId: string }> };

/** Read only a published drive visible to this learner's scoped college,
 * current cohort and section. The upload owner is never inferred from a
 * client-supplied object key and the signed URL is never persisted. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { jobId } = await params;
    if (!placementJobIdSchema.safeParse(jobId).success)
      return NextResponse.json({ error: "INVALID_JOB" }, { status: 400, headers: noStore });
    const context = await getCurrentRequestContext();
    const rows = await listLearnerPlacementJobs(context, new Date(), jobId);
    const job = rows.find(row => row.job.id === jobId)?.job;
    if (!job || job.status !== "PUBLISHED" || !job.jobDescriptionObjectPath)
      return NextResponse.json({ error: "DOCUMENT_NOT_FOUND" }, { status: 404, headers: noStore });
    const objectKey = job.jobDescriptionObjectPath;
    const parts = objectKey.split("/");
    if (parts.length !== 5 || parts[0] !== "private" ||
        parts[1] !== job.collegeId || parts[3] !== "placement-document" ||
        !/^[0-9a-f-]{36}$/i.test(parts[2] ?? "") ||
        !/^[0-9a-f-]{36}$/i.test(parts[4] ?? ""))
      return NextResponse.json({ error: "DOCUMENT_NOT_FOUND" }, { status: 404, headers: noStore });
    const grant = await createPrivateReadGrant({
      objectKey, collegeId: job.collegeId, ownerMembershipId: parts[2]!,
    });
    return NextResponse.json({
      readUrl: grant.readUrl, expiresAt: grant.expiresAt.toISOString(),
      contentType: grant.contentType,
    }, { headers: noStore });
  } catch (error) { return apiErrorResponse(error); }
}
