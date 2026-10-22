import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  commitTpoAcademicImport, previewTpoAcademicImport,previewTpoLegacyAcademicImport,
} from "@/modules/placements/tpo-academic-import-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const body = z.object({
      action: z.enum(["PREVIEW", "IMPORT", "CORRECT", "LEGACY_PREVIEW"]),
      rows: z.array(z.unknown()).min(1).max(5000),
      skipUnmatched: z.boolean().optional(),
      mode: z.enum(["BULK", "SINGLE"]).optional(),
    }).parse(await request.json());
    // Legacy single-record PUT is the CORRECT action here. A one-row
    // correction must never silently skip a missing or out-of-college learner.
    // Bulk preview and import keep their existing contract.
    const mode = body.action === "CORRECT" ? "SINGLE" : body.mode ?? "BULK";
    if ((body.action === "CORRECT" || mode === "SINGLE") && body.rows.length !== 1)
      return NextResponse.json({error:"ACADEMIC_CORRECTION_REQUIRES_ONE_STUDENT",
        message:"Choose exactly one learner to correct.",
      },{status:422,headers:{"Cache-Control":"private, no-store"}});
    const input = {rows:body.rows,mode,skipUnmatched:mode==="SINGLE"?false:body.skipUnmatched??false};
    if(body.action==="LEGACY_PREVIEW")
      return NextResponse.json({
        preview:await previewTpoLegacyAcademicImport(context,body.rows),
        identifierType:"SCOPED_ROLL_OR_MEMBERSHIP_UUID",
      },{headers:{"Cache-Control":"private, no-store"}});
    // Verified writes remain atomic in 200-row transactions. A larger
    // legacy spreadsheet is previewed completely, then the caller explicitly
    // confirms individual batches; a partial import must never be described
    // as one atomic 5000-row success.
    if(body.action==="IMPORT"&&body.rows.length>200)
      return NextResponse.json({error:"ACADEMIC_IMPORT_BATCH_TOO_LARGE",
        message:"Review the complete preview, then import up to 200 verified rows per batch.",
        batchSize:200,batchCount:Math.ceil(body.rows.length/200),
        stagedCount:body.rows.length,
      },{status:422,headers:{"Cache-Control":"private, no-store"}});
    // studentCode is the college-scoped learner membership UUID, NOT an
    // integer legacy learner or platform-user ID. Resolve historical IDs
    // offline through an approved college+learner crosswalk before this API.
    if (body.action === "PREVIEW"){
      const combined:Awaited<ReturnType<typeof previewTpoAcademicImport>>["rows"]=[];
      for(let offset=0;offset<body.rows.length;offset+=200){
        const part=await previewTpoAcademicImport(context,{
          ...input,rows:body.rows.slice(offset,offset+200),
        });
        combined.push(...part.rows);
      }
      return NextResponse.json({
        preview:{rows:combined},stagedCount:body.rows.length,
        matchCount:combined.filter(row=>row.match==="WILL_UPDATE").length,
        unmatchedCount:combined.filter(row=>row.match!=="WILL_UPDATE").length,
        batchSize:200,batchCount:Math.ceil(combined.length/200),
        requiresExplicitConfirmation:true,
        identifierType:"COLLEGE_LEARNER_MEMBERSHIP_UUID",
      },{headers:{"Cache-Control":"private, no-store"}});
    }
    const result=await commitTpoAcademicImport(context,input);
    return NextResponse.json({
      result,updated:result.updated,skipped:result.skipped,
      updatedCount:result.updated,
      message:result.updated===0?"No academic records were changed.":mode==="SINGLE"?"Academic record corrected":"Academic records updated",
      identifierType:"COLLEGE_LEARNER_MEMBERSHIP_UUID",
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return apiErrorResponse(error); }
}
