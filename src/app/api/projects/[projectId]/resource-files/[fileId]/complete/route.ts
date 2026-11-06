import { route } from "@/security/route";
import { storageJson } from "@/lib/storage-route";
import { completeProjectFileUpload } from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "projects.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId, fileId } = params;
    const file = await completeProjectFileUpload(context, projectId, fileId);
    return storageJson({ file });
  },
);
