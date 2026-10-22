import {describe,expect,it} from "vitest";
import {normalizeLegacyProjectBlueprint} from "@/modules/projects/validation";

describe("chat-19 import-only project row safety",()=>{
 it("G2-5-029-028 rejects a malformed sprint with its row index rather than dropping it",()=>{
  expect(()=>normalizeLegacyProjectBlueprint({sprints:[{key:"first"},null,{key:"third"}]}))
   .toThrow("Legacy sprints row 2 is invalid");
 });
 it("rejects malformed task and resource rows without renumbering valid items",()=>{
  expect(()=>normalizeLegacyProjectBlueprint({tasks:[42]}))
   .toThrow("Legacy tasks row 1 is invalid");
  expect(()=>normalizeLegacyProjectBlueprint({resources:"invalid"}))
   .toThrow("Legacy resources must be a list");
 });
 it("preserves missing optional sections as empty lists",()=>{
  const result=normalizeLegacyProjectBlueprint({overview:{title:"Test"}}) as {
   sprints:unknown[];tasks:unknown[];resources:unknown[];
  };
  expect(result.sprints).toEqual([]);
  expect(result.tasks).toEqual([]);
  expect(result.resources).toEqual([]);
 });
});
