import "server-only";
import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import {AuthorizationError} from "@/modules/permissions/policy";
import { onboardPersonWithRuntime } from "./runtime";
import { parseFacultyBulkCsv } from "./faculty-bulk-import-model";

const schema = z.object({
  collegeId: z.string().uuid(),
  csv: z.string().min(1).max(1_500_000),
  confirmed: z.literal(true),
}).strict();

/** Per-row results intentionally preserve partial successes for recovery. */
export async function importFacultyCsv(context: RequestContext, input: unknown) {
  const body = schema.parse(input);
  const actor = await resolveActingCollege(context, "people.manage");
  if (actor.collegeId !== body.collegeId) throw new AuthorizationError("people.manage");
  const rows = parseFacultyBulkCsv(body.csv);
  const seen = new Set<string>();
  const results: Array<{
    row: number; name: string; status: "CREATED"|"SKIPPED"|"FAILED"; message: string;
  }> = [];
  for (let index=0; index<rows.length; index++) {
    const entry=rows[index];
    const name=(entry.firstName+" "+entry.lastName).trim();
    if (seen.has(entry.phoneE164)) {
      results.push({row:index+1,name,status:"SKIPPED",message:"Duplicate mobile in this file"});
      continue;
    }
    seen.add(entry.phoneE164);
    try {
      await onboardPersonWithRuntime(context, {
        collegeId: actor.collegeId, displayName: name,
        phoneE164: entry.phoneE164, ...(entry.email?{email:entry.email}:{}),
        roles:entry.facultyType==="MENTOR"?["FACULTY","MENTOR"]:["FACULTY"],
      });
      results.push({row:index+1,name,status:"CREATED",message:"Faculty membership onboarded"});
    } catch(error) {
      const code=error && typeof error === "object" && "code" in error ? String(error.code) : "";
      results.push({row:index+1,name,status:"FAILED",
        message:code==="IDENTITY_COLLISION"?"Email or mobile already belongs to another identity":
          "Could not onboard this record. Check the identity and college permissions."});
    }
  }
  return {total:rows.length,created:results.filter(x=>x.status==="CREATED").length,
    failed:results.filter(x=>x.status==="FAILED").length,
    skipped:results.filter(x=>x.status==="SKIPPED").length,results};
}
