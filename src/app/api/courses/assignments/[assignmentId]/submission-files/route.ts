import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  issueSubmissionFileUploadGrant,
  listMySubmissionFiles,
} from "@/modules/courses/assignment-submission-file-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const deliveryId = new URL(request.url).searchParams.get("deliveryId") ?? "";
    const files = await listMySubmissionFiles(context, assignmentId, deliveryId);
    return storageJson({ files });
  },
);

export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const body = await readJsonBody(request);
    const result = await issueSubmissionFileUploadGrant(context, assignmentId, body as never);
    return storageJson(result, 201);
  },
);
