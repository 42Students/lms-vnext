import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("TPO batch rule unsaved protection",()=>{
 it("TPO-batches-55 blocks ordinary route changes and unload until rule edits are saved",()=>{
  const ui=readFileSync("src/components/tpo/tpo-batch-rule-editor.tsx","utf8");
  expect(ui).toContain("Discard your unsaved batch-rule changes?");
  expect(ui).toContain('window.addEventListener("beforeunload",warn)');
  expect(ui).toContain('document.addEventListener("click",onClick,true)');
  expect(ui).toContain('window.addEventListener("popstate",onPopState)');
  expect(ui).toContain("event.preventDefault()");
  expect(ui).toContain("event.stopPropagation()");
  expect(ui).toContain("setBaseline(values)");
  expect(ui).toContain('if(!changed||busy)return;');
 });
});
