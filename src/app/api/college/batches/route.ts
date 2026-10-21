import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeCohortMutationError, createCollegeCohort,
} from "@/modules/academics/college-cohort-mutation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const raw=body&&typeof body==="object"&&!Array.isArray(body)
      ?body as Record<string,unknown>:{};
    if("batchName" in raw&&!raw.startPeriodId){
      return NextResponse.json({
        status:"ERROR",error:"BATCH_PERIOD_REQUIRED",
        message:"Select an exact academic start period and program UUID before creating a batch. Legacy year-only records cannot identify a period.",
      },{status:400});
    }
    const cohort = await createCollegeCohort(context, body);
    return NextResponse.json({
      success: true,status:"OK",message:"Batch created successfully",
      cohort,data:cohort,
      idKind:"UUID",lifecycle:"ARCHIVE_NOT_HARD_DELETE",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeCohortMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code.endsWith("NOT_FOUND") ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}

// Old LMS fetchByProgram returns a status/message/data envelope. The college,
// program and membership are still validated by the same vNext scoped read
// service, and the returned IDs are UUIDs, never integer legacy IDs.
export async function GET(request:Request){
 try{
  const {listCollegeBatches}=await import("@/modules/academics/college-academic-directory-service");
  const {collegeBatchDirectorySchema}=await import("@/modules/academics/college-academic-directory-model");
  const url=new URL(request.url);
  if([...url.searchParams].some(([key])=>!["programId","status","page","pageSize"].includes(key))||
     [...url.searchParams.keys()].some(key=>url.searchParams.getAll(key).length!==1))
   return NextResponse.json({error:"INVALID_BATCH_FILTERS"},{status:400});
  const parsed=collegeBatchDirectorySchema.safeParse({
    programId:url.searchParams.get("programId")??undefined,
    status:url.searchParams.get("status")??undefined,
    page:url.searchParams.get("page")??undefined,
    pageSize:url.searchParams.get("pageSize")??undefined,
  });
  if(!parsed.success)
   return NextResponse.json({error:"INVALID_BATCH_FILTERS"},{status:400});
  const data=await listCollegeBatches(await getCurrentRequestContext(),parsed.data);
  return NextResponse.json({
    status:"OK",message:"OK",data:data.items,pagination:{
     page:data.query.page,pageSize:data.query.pageSize,total:data.total,totalPages:data.totalPages,
    },idKind:"UUID",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
