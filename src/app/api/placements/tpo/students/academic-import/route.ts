import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  commitTpoAcademicImport, previewTpoAcademicImport,previewTpoLegacyAcademicImport,
} from "@/modules/placements/tpo-academic-import-service";

export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = z.object({
      action: z.enum(["PREVIEW", "IMPORT", "CORRECT", "LEGACY_PREVIEW"]),
      rows: z.array(z.unknown()).min(1).max(5000),
      skipUnmatched: z.boolean().optional(),
      mode: z.enum(["BULK", "SINGLE"]).optional(),
    }).parse(await boundedRequestJson(request, 8 * 1024 * 1024));
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
    if(body.action==="IMPORT"&&body.rows.length>200)
      return NextResponse.json({error:"ACADEMIC_IMPORT_BATCH_TOO_LARGE",
        message:"Review the complete preview, then import up to 200 verified rows per batch.",
        batchSize:200,batchCount:Math.ceil(body.rows.length/200),
        stagedCount:body.rows.length,
      },{status:422,headers:{"Cache-Control":"private, no-store"}});
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
  },
);
