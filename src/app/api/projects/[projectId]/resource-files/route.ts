import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  issueProjectFileUploadGrant,
  listProjectFiles,
} from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const files = await listProjectFiles(context, projectId);
    return storageJson({ files });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const body = await readJsonBody(request);
    const result = await issueProjectFileUploadGrant(context, projectId, body as never);
    return storageJson(result, 201);
  },
);
