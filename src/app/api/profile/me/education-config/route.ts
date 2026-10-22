import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getOwnLearnerEducationCatalog} from "@/modules/people/learner-profile-education-catalog-service";

export const runtime="nodejs";
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 if([...params.keys()].some(key=>key!=="q")||params.getAll("q").length>1)
  return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
 const q=params.get("q")??"";
 if(q.length>100)return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
 try{
  const result=await getOwnLearnerEducationCatalog(
   await getCurrentRequestContext(),q);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
