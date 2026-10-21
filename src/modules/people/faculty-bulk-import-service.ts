import "server-only";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { departments } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import {AuthorizationError} from "@/modules/permissions/policy";
import { onboardPersonWithRuntime, upsertFacultyProfileWithRuntime } from "./runtime";
import { parseFacultyBulkCsv } from "./faculty-bulk-import-model";

const schema = z.object({
  collegeId: z.string().uuid(),
  departmentId: z.string().uuid(),
  csv: z.string().min(1).max(1_500_000),
  confirmed: z.literal(true),
}).strict();

/** Per-row results intentionally preserve partial successes for recovery. */
export async function importFacultyCsv(context: RequestContext, input: unknown) {
  const body = schema.parse(input);
  const actor = await resolveActingCollege(context, "people.manage");
  if (actor.collegeId !== body.collegeId) throw new AuthorizationError("people.manage");
  // Validate the chosen academic department BEFORE creating any identities.
  const [department] = await getDb().select({id:departments.id})
    .from(departments).where(and(eq(departments.id,body.departmentId),
      eq(departments.collegeId,actor.collegeId),isNull(departments.archivedAt)))
    .limit(1);
  if (!department) throw new Error("The selected department is unavailable in this college.");
  const rows = parseFacultyBulkCsv(body.csv);
  const seen = new Set<string>();
  const seenEmails = new Set<string>();
  const results: Array<{
    row: number; name: string; status: "CREATED"|"SKIPPED"|"FAILED"|"PARTIAL"; message: string;
  }> = [];
  for (let index=0; index<rows.length; index++) {
    const entry=rows[index];
    const name=(entry.firstName+" "+entry.lastName).trim();
    if (seen.has(entry.phoneE164)) {
      results.push({row:index+1,name,status:"SKIPPED",message:"Duplicate mobile in this file"});
      continue;
    }
    seen.add(entry.phoneE164);
    const normalizedEmail = entry.email?.toLowerCase();
    if (normalizedEmail && seenEmails.has(normalizedEmail)) {
      results.push({row:index+1,name,status:"SKIPPED",message:"Duplicate email in this file"});
      continue;
    }
    if (normalizedEmail) seenEmails.add(normalizedEmail);
    try {
      const person = await onboardPersonWithRuntime(context, {
        collegeId: actor.collegeId, displayName: name,
        phoneE164: entry.phoneE164, ...(entry.email?{email:entry.email}:{}),
        roles:entry.facultyType==="MENTOR"?["FACULTY","MENTOR"]:["FACULTY"],
      });
      // A successful identity is not a successful faculty registration until
      // its tenant-owned department and legacy faculty type are attached.
      try {
        await upsertFacultyProfileWithRuntime(context,person.membership.id,{
          primaryDepartmentId:department.id,
          employmentType:entry.facultyType==="MENTOR"?"Mentor":"Lecturer",
          academicTitle:null,
        });
        results.push({row:index+1,name,status:"CREATED",
          message:"Faculty registered with department and faculty type."});
      } catch {
        results.push({row:index+1,name,status:"PARTIAL",
          message:"Account created, but department or faculty type could not be saved. Review this faculty membership before retrying; do not create the same mobile again."});
      }
    } catch(error) {
      const code=error && typeof error === "object" && "code" in error ? String(error.code) : "";
      results.push({row:index+1,name,status:"FAILED",
        message:code==="IDENTITY_COLLISION"?"Email or mobile already registered; verify this faculty record before retrying":
          "Could not onboard this record. Check the identity and college permissions."});
    }
  }
  const created=results.filter(x=>x.status==="CREATED").length;
  return {total:rows.length,created,
    failed:results.filter(x=>x.status==="FAILED").length,
    skipped:results.filter(x=>x.status==="SKIPPED").length,
    partial:results.filter(x=>x.status==="PARTIAL").length,results,
    successMessage:created>0?"Faculty registered successfully! They can now login with their mobile number.":null};
}
