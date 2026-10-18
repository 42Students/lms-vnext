import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 bulkStudentSelectionIsCurrent,superAdminStudentBulkFailure,
} from "@/modules/module-access/super-admin-student-bulk-feedback";

describe("SA-STUDENT-BULK-18 selected-college bulk controls",()=>{
 it("only permits distinct currently visible learner memberships within the 25-row cap",()=>{
  expect(bulkStudentSelectionIsCurrent(["a","b"],["a","b","c"])).toBe(true);
  for(const [ids,visible] of [
    [[],["a","b"]],[["a","a"],["a","b"]],[["outside"],["a"]],
    [Array.from({length:26},(_,i)=>String(i)),Array.from({length:26},(_,i)=>String(i))],
  ] as [string[],string[]][])
    expect(bulkStudentSelectionIsCurrent(ids,visible)).toBe(false);
 });
 it("maps forbidden, stale and validation failures to actionable copy without leaking raw codes",()=>{
  expect(superAdminStudentBulkFailure(403)).toContain("Your access changed");
  expect(superAdminStudentBulkFailure(409)).toContain("Reload the roster");
  expect(superAdminStudentBulkFailure(400)).toContain("Check the selected students");
  expect(superAdminStudentBulkFailure(503)).toContain("Refresh this college");
  for(const code of [401,403,409,422,500]){
    const copy=superAdminStudentBulkFailure(code);
    expect(copy).not.toContain("FORBIDDEN");
    expect(copy).not.toContain("INVALID_REQUEST");
  }
 });
 it("freezes confirmed membership IDs, suppresses duplicate clicks and disables in-flight selectors",()=>{
  const source=readFileSync("src/components/admin/super-admin-student-bulk-access.tsx","utf8");
  expect(source).toContain("if(pendingRef.current||busy)return");
  expect(source).toContain("bulkStudentSelectionIsCurrent(selected,capped.map");
  expect(source).toContain("const membershipIds=[...selected],requestedModule=module,requestedAction=action");
  expect(source).toContain("pendingRef.current=true");
  expect(source).toContain("pendingRef.current=false");
  expect(source).toContain("superAdminStudentBulkFailure(response.status)");
  expect(source).toContain("value={module} disabled={busy}");
  expect(source).toContain("value={action} disabled={busy}");
 });
});
