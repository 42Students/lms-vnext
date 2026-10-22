import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoDriveEligibilityReachPreview} from "@/modules/placements/tpo-drive-edit-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
export async function GET(_request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  const data=await getTpoDriveEligibilityReachPreview(
   await getCurrentRequestContext(),jobId);
  return NextResponse.json(data,{headers:noStore});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
