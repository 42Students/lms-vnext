import {NextResponse} from "next/server";
import {GET as listScopedPlacementJobs} from "../route";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";

/** Authenticated, college-scoped replacement for the old /api/v2/jobs/search
 * URL. Use the same authorization, SQL pagination, and error handling as the
 * main placements reader: no global JobSearchCache or unauthenticated CORS.
 * A legacy learner/department/program selector cannot silently fall back to
 * a broader employer list. Call the scoped learner discovery endpoint for
 * those audiences instead.
 */
async function handleGET(request:Request){
 const url=new URL(request.url);
 const unsupported=["learnerId","deptId","programId","jobType"].filter(key=>
   url.searchParams.has(key));
 if(unsupported.length){
  return NextResponse.json({
   error:"LEGACY_JOB_SEARCH_FILTER_UNAVAILABLE",
   message:"Use your college-scoped learner job search for learner, department, program or job-type filters.",
   unsupported,
  },{status:400,headers:{"Cache-Control":"private, no-store"}});
 }
 url.searchParams.set("mode","search");
 const scopedRequest=new Request(url.toString(),{
  method:"GET",headers:request.headers,
 });
 return listScopedPlacementJobs(scopedRequest);
}
export const GET = secured(handleGET);
