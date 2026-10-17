import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Company Memory user-safe load failures",()=>{
 it("TPO-companies-21 identifies a genuinely missing company and provides retry without raw DB09 details",()=>{
  const ui=src("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(ui).toContain('"Company not found"');
  expect(ui).toContain('onClick={retry}>Retry');
  expect(ui).toContain('payload.error === "DATABASE_NOT_READY"');
  expect(ui).toContain('"Company details are unavailable right now. Try again."');
  expect(ui).toContain("Students-placed counts are unavailable");
  expect(ui).not.toContain("Company Memory is awaiting DB09 database verification.");
 });
});