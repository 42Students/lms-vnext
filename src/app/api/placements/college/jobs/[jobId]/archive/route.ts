import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {archiveCollegeDrive,previewCollegeDriveArchive} from "@/modules/placements/college-drive-archive-preview-service";
/** Legacy DELETE /admin/jobs/{id} was a soft deletion. In vNext GET presents
 * scoped impact, then same-origin confirmed POST archives (never hard deletes)
 * the job and preserves applications, offers and event history. Consumers
 * must refresh their job status and filter archived entries, not assume 404.
 */
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(
  await previewCollegeDriveArchive(__ctx,jobId),
  {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(
  await archiveCollegeDrive(__ctx,jobId,await boundedRequestJson(req)),
  {headers:{"Cache-Control":"private, no-store"}});
  },
);
