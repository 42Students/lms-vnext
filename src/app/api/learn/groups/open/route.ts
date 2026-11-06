import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listLearnerGroups} from "@/modules/groups/learner-group-list-service";
import {learnerGroupKindSchema} from "@/modules/groups/learner-group-detail-service";
import {apiErrorResponse} from "@/lib/api-error";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(request:Request){
 try{
  const raw=new URL(request.url).searchParams.get("kind");
  const kind=raw?learnerGroupKindSchema.parse(raw.toUpperCase()):undefined;
  const result=await listLearnerGroups(await getCurrentRequestContext(),new Date(),kind);
  return NextResponse.json(result.open,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
