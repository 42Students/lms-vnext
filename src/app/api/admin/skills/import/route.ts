import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
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
  // A metadata-only Content-Length check cannot cap chunked uploads.
  const decoded=await readBoundedUtf8Body(request,210_000);
  if(decoded.kind==="TOO_LARGE")
   return NextResponse.json({error:"SOURCE_TOO_LARGE"},{status:413});
  if(decoded.kind!=="OK")
   return NextResponse.json({error:"INVALID_SOURCE"},{status:400});
  let body:unknown;
  try{body=JSON.parse(decoded.body);}catch{
   return NextResponse.json({error:"INVALID_SOURCE"},{status:400});
  }
  const result=await reconcileLegacySkillCatalog(await getCurrentRequestContext(),body);
  return NextResponse.json({report:result},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
