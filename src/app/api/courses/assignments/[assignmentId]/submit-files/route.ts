import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import { submitAssignmentWithFiles } from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const body = await readJsonBody(request);
    const result = await submitAssignmentWithFiles(context, assignmentId, body as never);
    return storageJson(result, 201);
  },
);
