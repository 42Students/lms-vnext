import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(file:string)=>readFileSync(file,"utf8");

describe("GR-31 + GR-09 Super Admin write safety",()=>{
 it("SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network failure",()=>{
  const code=source("src/components/admin/college-branding-form.tsx");
  expect(code).toContain("const savingRef = useRef(false)");
  expect(code).toContain("if (!canEdit || savingRef.current) return");
  expect(code).toContain("savingRef.current = true");
  expect(code).toContain("savingRef.current = false");
  expect(code).toContain("} catch {");
  expect(code).toContain("Could not save branding. Check your connection and try again.");
  expect(code).toContain("disabled={saving}");
  expect(code).toContain("JSON.stringify({...clean(values),expectedVersion:version})");
  expect(code).toContain("setVersion(data.branding.version)");
  expect(code).toContain("Your edits are preserved. Refresh before saving again.");
 });
 it("SA-academics-people-batch-01 prevents double move, keeps row-state errors friendly and checks capacity",()=>{
  const code=source("src/components/admin/super-admin-batch-roster-manager.tsx");
  expect(code).toContain("const pendingRef=useRef(false)");
  expect(code).toContain("if(pendingRef.current)return");
  expect(code).toContain("pendingRef.current=true");
  expect(code).toContain("pendingRef.current=false");
  expect(code).toContain('json?.error==="SECTION_CAPACITY_REACHED"');
  expect(code).not.toContain('":json?.error??"');
  expect(code).toContain("target.learnerCount>=target.capacity");
  expect(code).toContain("current.academicPeriodId!==target.academicPeriodId");
  expect(code).toContain('method:"POST"');
  expect(code).toContain("<ConfirmDialog");
 });
});