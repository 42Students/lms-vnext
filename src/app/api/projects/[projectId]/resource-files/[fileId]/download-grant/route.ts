import { route } from "@/security/route";
import { readOptionalJsonBody, storageJson } from "@/lib/storage-route";
import { issueProjectFileDownloadGrant } from "@/modules/projects/project-resource-file-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, fileId } = params;
    const body = (await readOptionalJsonBody(request)) as { disposition?: "inline" | "attachment" };
    const grant = await issueProjectFileDownloadGrant(context, projectId, fileId, { ...(body.disposition!==undefined?{disposition:body.disposition}:{}) });
    return storageJson({ grant });
  },
);
