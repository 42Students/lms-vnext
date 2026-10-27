import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {safeTpoFindResult} from "@/components/shell/topbar/tpo-find-model";

const candidate=(href:string):unknown=>({group:"Students",label:"Learner",href});

describe("TPO finder navigation safety across command surfaces",()=>{
 it("accepts valid tenant-scoped portal links, including safe query parameters",()=>{
  expect(safeTpoFindResult(candidate("/tpo/students?q=CS21&student=123"))).toBe(true);
  expect(safeTpoFindResult(candidate("/tpo/placements/jobs/123"))).toBe(true);
  expect(safeTpoFindResult(candidate("/tpo/students?q=%2F"))).toBe(true);
 });
 it.each([
  "/tpo//evil", "/tpo/../admin", "/tpo/%2e%2e/admin",
  "/tpo/%2F%2Fevil", "/tpo/%5cadmin", "/tpo/students\\\\evil",
  "/tpo/%XX", "/tpo/students?x=\n", "//evil.example/tpo/students",
  "https://evil.example/tpo/students", "javascript:alert(1)",
  "/admin/people", "/tpo",
 ])("blocks malformed or escaped navigation path %j",href=>{
  expect(safeTpoFindResult(candidate(href))).toBe(false);
 });
 it("rejects missing or invalid label/group fields",()=>{
  expect(safeTpoFindResult({group:"Students",label:"",href:"/tpo/students"})).toBe(false);
  expect(safeTpoFindResult({group:"",label:"Alice",href:"/tpo/students"})).toBe(false);
  expect(safeTpoFindResult({group:"Students",label:42,href:"/tpo/students"})).toBe(false);
 });
 it("requires both TPO finder surfaces to use the shared portal-safe validator",()=>{
  const shortcut=readFileSync(new URL("../../src/components/tpo/tpo-find-shortcut.tsx",import.meta.url),"utf8");
  const fourWay=readFileSync(new URL("../../src/components/tpo/tpo-four-entity-search.tsx",import.meta.url),"utf8");
  expect(shortcut).toContain(".filter(safeTpoFindResult)");
  expect(shortcut).toContain("if(!safeTpoFindResult(row))return;");
  expect(fourWay).toContain(".filter(safeTpoFindResult)");
  expect(shortcut).not.toContain("safeMatch=");
  expect(fourWay).not.toContain('item.href.startsWith("/tpo/")');
 });
});
