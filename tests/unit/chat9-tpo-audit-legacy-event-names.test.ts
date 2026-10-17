import {describe,expect,it} from "vitest";
import {formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";

describe("TPO audit uses the legacy action sentences",()=>{
 it("TPO-settings-audit-94 restores meaningful settings, recruiter, and drive activity names",()=>{
  const labels={
   PLACEMENTS_COLLEGE_RULES_UPDATED:"Placement rules changed",
   "placements.tpo_job_type.created":"Job types changed",
   "placements.tpo_job_type.deleted":"Job types changed",
   "placements.tpo_bulk_undo.applied":"Bulk action undone",
   "placements.tpo_company_visibility.updated":"Company sharing settings changed",
   "placements.tpo_communication_setting.updated":"Placement settings changed",
   "placements.tpo_followup.created":"Recruiter follow-up added",
   "placements.tpo_followup.moved":"Recruiter follow-up moved",
   PLACEMENTS_RECRUITER_ACCESS_GRANTED:"Recruiter access granted",
   PLACEMENTS_RECRUITER_ACCESS_REVOKED:"Recruiter access revoked",
  } as const;
  for(const [eventType,label] of Object.entries(labels)){
   expect(formatTpoAuditEventType(eventType)).toBe(label);
   expect(formatTpoAuditEventType(eventType)).not.toBe(eventType);
  }
 });
});
