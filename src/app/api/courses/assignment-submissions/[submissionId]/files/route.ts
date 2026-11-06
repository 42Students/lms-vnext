import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { listSubmissionFiles } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { submissionId } = params;
    const files = await listSubmissionFiles(context, submissionId);
    return storageJson({ files });
  },
);
