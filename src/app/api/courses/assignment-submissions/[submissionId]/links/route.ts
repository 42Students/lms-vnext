import { route } from "@/security/route";
import {storageJson} from "@/lib/storage-route";
import {listAssignmentSubmissionLinks} from "@/modules/courses/assignment-submission-file-service";

export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {submissionId}=params;
    const links=await listAssignmentSubmissionLinks(context,submissionId);
    return storageJson({links});
  },
);
