import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {
 applyProductionScanVerdict,productionScannerCallbackReady,
} from "@/modules/storage/production-scan-verdict-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store"} as const;

/**
 * Restricted service-to-service callback. Only a deployed, vetted malware
 * scanner may possess the long independent webhook secret. It must scan all
 * bytes of the private R2 object, compute a digest, and supply the previously
 * captured object generation. Never expose this endpoint as a user action.
 */
export async function POST(request:Request){
  // Scheduled/service callbacks have no browser Origin. Reject a foreign Origin when one is supplied.
  if (request.headers.has("origin") && !isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const secret=process.env["PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET"]?.trim()??"";
 if(!productionScannerCallbackReady()){
  return NextResponse.json({error:"SCANNER_NOT_READY"},{status:503,headers:noStore});
 }
 const supplied=request.headers.get("x-private-storage-scanner-key")??"";
 const expected=Buffer.from(secret,"utf8"),actual=Buffer.from(supplied,"utf8");
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual)){
  return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:noStore});
 }
 const payload=await readBoundedUtf8Body(request,2048);
 if(payload.kind!=="OK"){
  return NextResponse.json({error:"INVALID_SCAN_VERDICT"},{status:400,headers:noStore});
 }
 let input:unknown;
 try{input=JSON.parse(payload.body);}
 catch{return NextResponse.json({error:"INVALID_SCAN_VERDICT"},{status:400,headers:noStore});}
 try{
  const result=await applyProductionScanVerdict(input);
  return NextResponse.json(result,{headers:noStore});
 }catch{
  // Neither object keys nor request bodies, scanner credentials, file titles,
  // SHA-256 digests or raw database errors may appear in provider-visible logs.
  return NextResponse.json({error:"SCAN_VERDICT_NOT_ACCEPTED"},
   {status:409,headers:noStore});
 }
}
