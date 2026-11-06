import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { completeSubmissionFileUpload } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { assignmentId, fileId } = params;
    const file = await completeSubmissionFileUpload(context, assignmentId, fileId);
    return storageJson({ file });
  },
);
