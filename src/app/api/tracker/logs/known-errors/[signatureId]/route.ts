import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { logAlertApiError } from "@/lib/log-alert-api-error";
import { mutateKnownErrorForAdmin } from "@/modules/log-alerts/admin-service";
import { z } from "zod";
import { alertEnvironment } from "@/modules/log-alerts/signature";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ signatureId: string }> },
) {
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({error:"DB10_LOG_ALERTS_MIGRATIONS_PENDING",message:"Known Errors are unavailable until the log-alert schema is verified."},
      {status:503,headers:{"Cache-Control":"private, no-store"}});
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { signatureId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    // Accept the legacy environment discriminator without exposing other
    // deployments. Existing vNext callers omit it and use the current env.
    if(body && typeof body==="object" && !Array.isArray(body)){
      const fields={...(body as Record<string,unknown>)};
      if("environment" in fields){
        const env=z.enum(["PRODUCTION","UAT","DEVELOPMENT"]).safeParse(fields.environment);
        if(!env.success)return NextResponse.json({error:"INVALID_REQUEST",field:"environment",message:"environment is required"},{status:400});
        if(env.data!==alertEnvironment())return NextResponse.json({error:"INVALID_REQUEST",message:"Environment is not available in this workspace."},{status:400});
        delete fields.environment;
        body=fields;
      }
      if(fields.action==="STATUS" && (typeof fields.status!=="string" || !fields.status.trim()))
        return NextResponse.json({error:"INVALID_REQUEST",field:"status",message:"status is required"},{status:400});
    }
    const item = await mutateKnownErrorForAdmin(context, signatureId, body);
    return NextResponse.json({ item });
  } catch (error) {
    return logAlertApiError(error);
  }
}
