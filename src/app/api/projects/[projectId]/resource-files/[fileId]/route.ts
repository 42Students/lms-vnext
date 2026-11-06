import { route } from "@/security/route";
import { readJsonBody, storageJson } from "@/lib/storage-route";
import {
  removeProjectFile,
  updateProjectFileDetails,
} from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "projects.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, fileId } = params;
    const body = await readJsonBody(request);
    const file = await updateProjectFileDetails(context, projectId, fileId, body as never);
    return storageJson({ file });
  },
);

export const DELETE = route(
  { auth: "user", permission: "projects.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId, fileId } = params;
    const file = await removeProjectFile(context, projectId, fileId);
    return storageJson({ file });
  },
);
