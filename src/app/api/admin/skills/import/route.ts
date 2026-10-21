import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {importAdminSkillCatalog} from "@/modules/skills/catalog-import-service";
import {ZodError} from "zod";
export const runtime="nodejs";

/** Admin-only deterministic catalog preview/import. This is NOT a browser
 * attachment or untrusted URL reader. Runtime and seed flags remain separate. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const length=Number(request.headers.get("content-length")??"0");
 if(Number.isFinite(length)&&length>250_000)
  return NextResponse.json({error:"REQUEST_TOO_LARGE"},{status:413});
 let body:unknown;
 try{body=await request.json();}
 catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
 try{
  const result=await importAdminSkillCatalog(await getCurrentRequestContext(),body);
  return NextResponse.json(result,{
   status:result.ready?200:503,
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_REQUEST",
    issues:error.issues.map(issue=>({
     path:issue.path.join("."),message:issue.message,
    }))},{status:400});
  return apiErrorResponse(error);
 }
}
