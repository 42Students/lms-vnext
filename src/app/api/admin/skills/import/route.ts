import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reconcileLegacySkillCatalog} from "@/modules/skills/skill-source-import-service";
export const runtime="nodejs";
/** Upload the bounded decoded RTF/CSV text through authenticated JSON only.
 * No remote URL fetch, file path, automatic seed or public ingestion route. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const bytes=await request.text();
  if(bytes.length>210000)return NextResponse.json({error:"SOURCE_TOO_LARGE"},{status:413});
  let body:unknown;
  try{body=JSON.parse(bytes);}catch{
   return NextResponse.json({error:"INVALID_SOURCE"},{status:400});
  }
  const result=await reconcileLegacySkillCatalog(await getCurrentRequestContext(),body);
  return NextResponse.json({report:result},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
