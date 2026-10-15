import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { storageJson } from "@/lib/storage-route";
import { listSubmissionFiles } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { submissionId } = await params;
    const files = await listSubmissionFiles(context, submissionId);
    return storageJson({ files });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
