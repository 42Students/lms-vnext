import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {parseRecruiterSelectionXlsx} from "@/modules/placements/recruiter-selection-xlsx-model";
export const runtime="nodejs";
/** Parses only worksheet A IDs. This endpoint never grants candidate visibility
 * or stages a selection: the submission service rechecks the exact shortlist. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const ctx=await getCurrentRequestContext().catch(()=>null);
 if(!ctx||!hasActiveRecruiter(ctx)||ctx.recruiter?.userId!==ctx.user.id)
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 const length=Number(request.headers.get("content-length"));
 if(Number.isFinite(length)&&length>300000)
  return NextResponse.json({error:"FILE_TOO_LARGE"},{status:413});
 const form=await request.formData().catch(()=>null);
 const file=form?.get("file");
 if(!(file instanceof File)||file.size>256000||!file.name.toLowerCase().endsWith(".xlsx"))
  return NextResponse.json({error:"INVALID_FILE"},{status:400});
 const outcome=parseRecruiterSelectionXlsx(new Uint8Array(await file.arrayBuffer()));
 if(!outcome.ok)return NextResponse.json({error:outcome.error},{status:422});
 return NextResponse.json(outcome,{headers:{"Cache-Control":"no-store"}});
}
