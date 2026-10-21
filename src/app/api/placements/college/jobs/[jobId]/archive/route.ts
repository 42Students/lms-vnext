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
export async function GET(_req:Request,{params}:Props){
 try{const {jobId}=await params;return NextResponse.json(
  await previewCollegeDriveArchive(await getCurrentRequestContext(),jobId),
  {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Props){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;return NextResponse.json(
  await archiveCollegeDrive(await getCurrentRequestContext(),jobId,await req.json()),
  {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
