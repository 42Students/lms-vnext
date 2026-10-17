import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoPrepError,listOwnTpoPrepAssignments} from "@/modules/placements/tpo-prep-assignment-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({assignments:await listOwnTpoPrepAssignments(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:503});
  return apiErrorResponse(error);}
}
