import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {setTpoOutsideDriveParticipant} from "@/modules/placements/recorded-outside-participation-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{recordId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {recordId}=await params;
  const body:unknown=await request.json();
  if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
  const validated=z.strictObject({
   membershipId:z.string().uuid(),result:z.enum(["PARTICIPATED","PASSED","FAILED","SELECTED","HIRED"]),
   notes:z.string().trim().max(500).optional(),
  }).parse(body);
  return NextResponse.json(await setTpoOutsideDriveParticipant(
   await getCurrentRequestContext(),{...validated,recordId}));
 }catch(error){return apiErrorResponse(error);}
}
