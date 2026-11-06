import { route } from "@/security/route";
import { readOptionalJsonBody, storageJson } from "@/lib/storage-route";
import { issueSubmissionFileDownloadGrant } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { fileId } = params;
    const body = (await readOptionalJsonBody(request)) as { disposition?: "inline" | "attachment" };
    const grant = await issueSubmissionFileDownloadGrant(context, fileId, { ...(body.disposition !== undefined ? { disposition: body.disposition } : {}) });
    return storageJson({ grant });
  },
);
