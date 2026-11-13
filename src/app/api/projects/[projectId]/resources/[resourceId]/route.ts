import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  archiveProjectResource,
  updateProjectResource,
} from "@/modules/projects/resource-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, resourceId } =
      params;
    const body = await boundedRequestJson(request);
    const resource = await updateProjectResource(
      context,
      projectId,
      resourceId,
      body,
    );
    return NextResponse.json({ resource });
  },
);

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId, resourceId } =
      params;
    const body: unknown=await boundedRequestJson(request).catch(()=>({}));
    const resource = await archiveProjectResource(
      context,
      projectId,
      resourceId,
      body,
    );
    return NextResponse.json({ resource });
  },
);
