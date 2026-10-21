import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listStandaloneProjectLearnerCandidates } from "@/modules/projects/class-team-roster-service";

export const runtime="nodejs";
export async function GET(request:Request){
  try{
    const input=z.strictObject({
      collegeId:z.string().uuid(),q:z.string().max(120).optional(),
      page:z.coerce.number().int().min(0).max(100).optional(),
    }).parse(Object.fromEntries(new URL(request.url).searchParams));
    const result=await listStandaloneProjectLearnerCandidates(await getCurrentRequestContext(),
      input.collegeId,input.q??"",input.page??0);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
