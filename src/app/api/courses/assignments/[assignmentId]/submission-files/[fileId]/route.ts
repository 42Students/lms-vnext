import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { removeStagedSubmissionFile } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { assignmentId, fileId } = params;
    const file = await removeStagedSubmissionFile(context, assignmentId, fileId);
    return storageJson({ file });
  },
);
