import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getAdminScopedSearchSuggestions} from "@/modules/admin-ui/admin-scoped-search-suggestion-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const querySchema=z.strictObject({
 kind:z.enum(["FACULTY","LEARNER"]),
 q:z.string().trim().max(100).default(""),
});
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const parsed=querySchema.safeParse(Object.fromEntries(params.entries()));
  if(!parsed.success)return NextResponse.json({error:"INVALID_SEARCH"},
   {status:400,headers:{"Cache-Control":"private, no-store"}});
  const context=await getCurrentRequestContext();
  const data=await getAdminScopedSearchSuggestions(context,parsed.data.kind,parsed.data.q);
  return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
