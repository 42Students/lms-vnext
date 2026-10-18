import {describe,expect,it} from "vitest";
import {parseProjectAdminAuditQuery} from "@/modules/projects/admin-audit-query-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

describe("Super Admin Projects activity ledger hostile URL handling",()=>{
 it("PROJ-BREAK-SA-27 never trusts first of duplicate filter or cursor parameters",()=>{
  const action=ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN;
  const single=parseProjectAdminAuditQuery({action,from:"2026-10-18",to:"2026-10-18"});
  expect(single.ignoredInvalidFilters).toBe(false);
  expect(single.eventType).toBe(action);
  expect(single.from).toBe("2026-10-18");

  for(const field of ["action","eventType","status","importance","subjectId","subjectType","from","to","beforeOccurredAt","beforeId"]){
   const parsed=parseProjectAdminAuditQuery({[field]:["first","second"]});
   expect(parsed.ignoredInvalidFilters,field).toBe(true);
   const property=field==="action"||field==="status"||field==="eventType"?"eventType":field;
   if(field!=="beforeOccurredAt"&&field!=="beforeId")expect((parsed as unknown as Record<string,unknown>)[property],field).toBeUndefined();
  }
  const conflicting=parseProjectAdminAuditQuery({
   action:[action,"projects.unknown"],subjectId:["known","foreign"],
   from:["2026-10-18","2026-10-19"],
  });
  expect(conflicting.ignoredInvalidFilters).toBe(true);
  expect(conflicting.eventType).toBeUndefined();
  expect(conflicting.subjectId).toBeUndefined();
  expect(conflicting.from).toBeUndefined();
 });
 it("PROJ-BREAK-SA-29 preserves legacy event aliases but rejects conflicting values",()=>{
  const event=ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN;
  for(const alias of ["action","status","eventType"]){
   const read=parseProjectAdminAuditQuery({[alias]:event});
   expect(read.eventType,alias).toBe(event);
   expect(read.ignoredInvalidFilters,alias).toBe(false);
  }
  const same=parseProjectAdminAuditQuery({action:event,status:event,eventType:event});
  expect(same.eventType).toBe(event);
  expect(same.ignoredInvalidFilters).toBe(false);
  const conflict=parseProjectAdminAuditQuery({
    action:event,status:"projects.unknown",
  });
  expect(conflict.eventType).toBeUndefined();
  expect(conflict.ignoredInvalidFilters).toBe(true);
  const conflict2=parseProjectAdminAuditQuery({
    action:event,eventType:"projects.other",
  });
  expect(conflict2.eventType).toBeUndefined();
  expect(conflict2.ignoredInvalidFilters).toBe(true);
 });

 it("PROJ-BREAK-SA-28 refuses rolled-over days and malformed cursor pairs",()=>{
  for(const invalid of ["2026-02-31","2026-13-01","2025-02-29","not-a-date"]){
   const parsed=parseProjectAdminAuditQuery({from:invalid});
   expect(parsed.ignoredInvalidFilters,invalid).toBe(true);
   expect(parsed.from).toBeUndefined();
  }
  expect(parseProjectAdminAuditQuery({from:"2024-02-29"}).from).toBe("2024-02-29");
  const invalidCursor=parseProjectAdminAuditQuery({beforeOccurredAt:"2026-10-18T12:00:00.000Z"});
  expect(invalidCursor.ignoredInvalidFilters).toBe(true);
  expect(invalidCursor.beforeOccurredAt).toBeUndefined();
  const wrongOrder=parseProjectAdminAuditQuery({from:"2026-10-19",to:"2026-10-18"});
  expect(wrongOrder.ignoredInvalidFilters).toBe(true);
  expect(wrongOrder.to).toBeUndefined();
 });
});
