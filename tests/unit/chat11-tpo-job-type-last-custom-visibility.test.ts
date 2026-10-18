import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {TPO_BUILTIN_JOB_TYPES} from "@/modules/placements/tpo-builtin-job-types";

describe("TPO-settings-audit-23 custom job type visibility",()=>{
 it("offers at least one fixed type by default while custom types remain optional",()=>{
  expect(TPO_BUILTIN_JOB_TYPES).toHaveLength(5);
  expect(new Set(TPO_BUILTIN_JOB_TYPES.map(item=>item.label)).size).toBe(5);
  expect(TPO_BUILTIN_JOB_TYPES.some(item=>item.label==="Full-time")).toBe(true);
 });
 it("lets the UI request disabling the last active custom row and delegates the real last-active decision to the server",()=>{
  const ui=readFileSync("src/components/tpo/tpo-job-types-editor.tsx","utf8");
  const service=readFileSync("src/modules/placements/tpo-job-type-write-service.ts","utf8");
  expect(ui).not.toContain("activeCount<=1");
  expect(ui).not.toContain("types.filter(item=>item.active).length");
  expect(ui).toContain('<button type="button" disabled={busy} onClick={()=>void send(');
  expect(ui).toContain("expectedVersion:item.updatedAt");
  expect(ui).toContain('code==="TPO_JOB_TYPE_LAST_ACTIVE"');
  expect(service).toContain("activeCustom+activeFixed<=1");
  expect(service).toContain('throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE")');
  expect(service).toContain("TPO_BUILTIN_JOB_TYPES.filter");
 });
});
