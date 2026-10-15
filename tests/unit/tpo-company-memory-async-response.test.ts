import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO Company Memory asynchronous effect commit",()=>{
 it("only commits fetch results after the async boundary and verifies aborted responses",()=>{
  const source=readFileSync("src/components/tpo/tpo-company-memory-workspace.tsx","utf8");
  const loader=source.slice(source.indexOf("const load = useCallback"),source.indexOf("function applyLoad"));
  expect(loader).toContain("await fetch");
  expect(loader).not.toContain("setCompany(");
  expect(loader).not.toContain("setPhase(");
  expect(loader).toContain("if (signal?.aborted) return null");
  const effect=source.slice(source.indexOf("useEffect(() => {"),source.indexOf("const activeContacts"));
  expect(effect).toContain(".then(result =>");
  expect(effect).toContain("!controller.signal.aborted");
 });
});
