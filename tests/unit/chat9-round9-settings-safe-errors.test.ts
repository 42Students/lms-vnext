import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 TPO settings friendly error contract",()=>{
 it("TPO-settings-audit-70 does not show raw backend error codes for optional SMS cap save",()=>{
  const s=read("src/components/tpo/tpo-communication-settings-editors.tsx");
  expect(s).not.toContain('body.error??"Settings were not saved."');
  expect(s).toContain("Settings were not saved. Refresh and try again.");
  expect(s).toContain("TPO_SETTINGS_STALE");
 });
 it("TPO-settings-audit-76 preserves draft signature without displaying raw backend codes",()=>{
  const s=read("src/components/tpo/tpo-communication-settings-editors.tsx");
  expect(s).toContain('setSaved(value);setCurrentVersion(body.version??null)');
  expect(s).toContain("Settings were not saved. Refresh and try again.");
 });
 it("TPO-settings-audit-40 gives friendly preparation-threshold failure guidance",()=>{
  const s=read("src/components/tpo/tpo-prep-percentage-editor.tsx");
  expect(s).not.toContain('result.error??"Could not save threshold."');
  expect(s).toContain("Could not save threshold. Refresh and try again.");
 });
 it("TPO-settings-audit-20 avoids exposing raw server strings on built-in type save failure",()=>{
  const s=read("src/components/tpo/tpo-builtin-job-types-editor.tsx");
  expect(s).not.toContain('data.error??"Could not save this job type."');
  expect(s).toContain("Could not save this job type. Refresh and try again.");
 });
});
