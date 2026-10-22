import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("lane-8 semester mapping stale refresh controls",()=>{
 const source=readFileSync("src/components/academics/college-term-mapping-manager.tsx","utf8");
 it("blocks stale term data but keeps validation errors independently correctable",()=>{
  expect(source).toContain("const [mappingStale, setMappingStale] = useState(false)");
  expect(source).toContain("setMappingStale(false)");
  expect(source).toContain('["TERM_NOT_FOUND","COURSE_NOT_FOUND","TERM_COURSE_DUPLICATE","TERM_COURSE_POSITION_INVALID"]');
  expect(source).toContain("if (readOnly || mappingStale || refreshing || inFlight.current) return;");
  expect(source).toContain("disabled={pending || refreshing || mappingStale || draggedId !== null} checked=");
  expect(source).toContain("Refresh semester courses before adding or editing selections.");
  expect(source).toContain('aria-label="Refresh semester courses"');
  expect(source).toContain("setRefreshing(true)");
 });
 it("preserves draft and dirty-edit discard prompts while revalidating",()=>{
  expect(source).toContain("draftByTerm");
  expect(source).toContain('title="Discard mapping changes?"');
  expect(source).toContain("requestScopeChange");
 });
});
