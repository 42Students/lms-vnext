import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO Company Memory fetch lifecycle",()=>{
 it("does not synchronously set React state in an initial data-loading effect",()=>{
  const source=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
  const loader=source.slice(source.indexOf("const load = useCallback("),source.indexOf("function retry()"));
  expect(loader).not.toMatch(/setCompany\(null\)/);
  expect(loader).not.toMatch(/setPhase\("loading"\)/);
  expect(loader).toMatch(/await fetch\(/);
 });
 it("clears previous data explicitly for a user-triggered retry",()=>{
  const source=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
  const retry=source.slice(source.indexOf("function retry()"),source.indexOf("useEffect("));
  expect(retry).toContain("setCompany(null)");
  expect(retry).toContain("setPhase(\"loading\")");
  expect(retry).toContain("setError(\"\")");
  // The guarded retry must pass its own AbortSignal and ignore older responses.
  expect(retry).toContain("activeLoad.current?.abort()");
  expect(retry).toContain("void load(controller.signal)");
  expect(retry).toContain("activeLoad.current===controller");
 });
});
