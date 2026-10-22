import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {isSuperAdmin} from "@/modules/identity/context";
import {assertE2EFixtureWriterEnabled,seedIsolatedE2EAcademicGraph}
 from "@/modules/people/e2e-fixture-seed-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
/**
 * No production registration is authorized to execute this endpoint:
 * strict server-side env gates, a separately provisioned 32+ byte secret,
 * same-origin browser CSRF protection, an authenticated Super Admin session,
 * and a persisted SUPER_ADMIN role rechecked inside the seed transaction.
 *
 * There is deliberately no URL/body parameter accepting a foreign tenant,
 * phone number or privilege. The namespace comes only from deployment env.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({status:"ERROR",error:"INVALID_ORIGIN"},
   {status:403,headers});
 try{assertE2EFixtureWriterEnabled();}
 catch{
  return NextResponse.json({status:"ERROR",error:"E2E_SEED_DISABLED"},
   {status:503,headers});
 }
 const secret=process.env["E2E_SEED_OPERATOR_SECRET"]??"";
 const supplied=request.headers.get("x-e2e-seed-key")??"";
 if(Buffer.byteLength(secret,"utf8")<32)
  return NextResponse.json({status:"ERROR",error:"E2E_SEED_NOT_CONFIGURED"},
   {status:503,headers});
 const expected=Buffer.from(secret,"utf8"),actual=Buffer.from(supplied,"utf8");
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))
  return NextResponse.json({status:"ERROR",error:"E2E_SEED_FORBIDDEN"},
   {status:403,headers});
 if(request.body!==null||new URL(request.url).search)
  return NextResponse.json({status:"ERROR",error:"E2E_SEED_TAKES_NO_INPUT"},
   {status:400,headers});
 try{
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context))
   return NextResponse.json({status:"ERROR",error:"E2E_SEED_FORBIDDEN"},
    {status:403,headers});
  const result=await seedIsolatedE2EAcademicGraph(context);
  // Report the persisted ledger, never prospective IDs as proof of rows.
  const complete=result.status==="COMPLETE";
  return NextResponse.json({
   status:complete?"OK":"PARTIAL",
   message:complete?"E2E fixture seeded":"E2E scaffold partially seeded",
   data:result,
  },{headers});
 }catch{
  return NextResponse.json({status:"ERROR",error:"E2E_SEED_FAILED"},
   {status:503,headers});
 }
}
