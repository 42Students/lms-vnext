import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const c="src/components/tpo/";
describe("chat-12 round3 Students friendly-error adoption",()=>{
 it("TPO-students-33 sanitizes request failures in tpo-academic-import-workspace.tsx",()=>{expect(src(c+"tpo-academic-import-workspace.tsx")).toContain("apiFetch<");expect(src(c+"tpo-academic-import-workspace.tsx")).not.toContain("body?.error");});
it("TPO-students-07 sanitizes request failures in tpo-student-nudge-panel.tsx",()=>{expect(src(c+"tpo-student-nudge-panel.tsx")).toContain("apiFetch<");expect(src(c+"tpo-student-nudge-panel.tsx")).not.toContain("body?.error");});
it("TPO-students-08 sanitizes request failures in tpo-roster-verification-bulk.tsx",()=>{expect(src(c+"tpo-roster-verification-bulk.tsx")).toContain("apiFetch<");expect(src(c+"tpo-roster-verification-bulk.tsx")).not.toContain("body?.error");});
it("TPO-students-09 sanitizes request failures in tpo-roster-verification-bulk.tsx",()=>{expect(src(c+"tpo-roster-verification-bulk.tsx")).toContain("apiFetch<");expect(src(c+"tpo-roster-verification-bulk.tsx")).not.toContain("body?.error");});
it("TPO-students-11 sanitizes request failures in tpo-student-note-editor.tsx",()=>{expect(src(c+"tpo-student-note-editor.tsx")).toContain("apiFetch<");expect(src(c+"tpo-student-note-editor.tsx")).not.toContain("body?.error");});
it("TPO-students-35 sanitizes request failures in tpo-student-saved-views.tsx",()=>{expect(src(c+"tpo-student-saved-views.tsx")).toContain("apiFetch<");expect(src(c+"tpo-student-saved-views.tsx")).not.toContain("body?.error");});
it("TPO-students-42 sanitizes request failures in tpo-student-quick-panel.tsx",()=>{expect(src(c+"tpo-student-quick-panel.tsx")).toContain("apiFetch<");expect(src(c+"tpo-student-quick-panel.tsx")).not.toContain("body?.error");});
it("TPO-students-54 sanitizes request failures in tpo-after-college-editor.tsx and tpo-after-college-bulk-editor.tsx",()=>{expect(src(c+"tpo-after-college-editor.tsx")).toContain("apiFetch<");expect(src(c+"tpo-after-college-editor.tsx")).not.toContain("body?.error");expect(src(c+"tpo-after-college-bulk-editor.tsx")).toContain("apiFetch<");expect(src(c+"tpo-after-college-bulk-editor.tsx")).not.toContain("body?.error");});
 it("GR-04 uses shared HTML-safe and timeout-aware apiFetch",()=>{
  for(const f of ["tpo-academic-import-workspace.tsx","tpo-student-nudge-panel.tsx","tpo-student-saved-views.tsx","tpo-student-note-editor.tsx","tpo-roster-verification-bulk.tsx","tpo-student-quick-panel.tsx","tpo-after-college-editor.tsx","tpo-after-college-bulk-editor.tsx"])expect(src(c+f)).toContain('from "@/lib/api-fetch"');
 });
 it("GR-09 does not render server codes in touched Students action components",()=>{
  for(const f of ["tpo-academic-import-workspace.tsx","tpo-student-nudge-panel.tsx","tpo-student-saved-views.tsx","tpo-student-note-editor.tsx","tpo-roster-verification-bulk.tsx","tpo-student-quick-panel.tsx","tpo-after-college-editor.tsx","tpo-after-college-bulk-editor.tsx"]){
   const s=src(c+f);
   expect(s).not.toMatch(/(?:body|result|payload|data)\??\.error/);
  }
 });
});
