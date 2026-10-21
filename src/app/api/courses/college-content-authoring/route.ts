import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {
 getCollegeContentAuthoringOptions,collegeExistingContentFiltersFromSearch,
} from "@/modules/courses/college-content-authoring-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Authorized scoped GET. No private storage keys or unreleased playback
 * tokens are returned; client aborts superseded searches on filter changes. */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const kind=z.enum(["YOUTUBE","RESOURCE","LIVE_CLASS"]).parse(params.get("kind"));
  const raw:Record<string,string>={};
  for(const [key,value] of params.entries()){
   if(key==="kind")continue;
   if(!["existingCourse","existingLesson","existingSection",
     "existingSearch","existingPage","existingOrderAll"].includes(key)||
     Object.hasOwn(raw,key))
    return Response.json({error:"INVALID_CONTENT_FILTER"},{
     status:400,headers:{"Cache-Control":"private, no-store"},
    });
   raw[key]=value;
  }
  const scope=collegeExistingContentFiltersFromSearch(raw);
  const data=await getCollegeContentAuthoringOptions(
   await getCurrentRequestContext(),kind,scope);
  return Response.json({
   items:data.existing,existingPage:data.existingPage,
   existingTruncated:data.existingTruncated,
   existingFilters:data.existingFilters,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
