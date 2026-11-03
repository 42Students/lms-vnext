import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const text=(p:string)=>readFileSync(p,"utf8");
describe("Learner request and authoring unsaved navigation must be consent-gated",()=>{
 it("stops in-app navigation before opening an accessible quiz-discard dialog",()=>{
  const src=text("src/components/courses/college-quiz-create.tsx");
  expect(src).toContain('event.stopImmediatePropagation();');
  expect(src).toContain('await askConfirm("Discard unsaved quiz changes?")');
  expect(src).toContain('allowConfirmedNavigation.current=true;');
  expect(src).toContain('window.location.assign(destination.href)');
  expect(src).toContain('if(allowConfirmedNavigation.current)return;');
  expect(src).not.toContain("window.confirm(");
 });
 it("keeps unsent placement reasons unless same-origin navigation is accepted",()=>{
  const src=text("src/components/placements/learner-placement-requests.tsx");
  expect(src).toContain('if(url.origin!==window.location.origin');
  expect(src).toContain('event.stopImmediatePropagation();');
  expect(src).toContain('await askConfirm("Discard this unsent placement request?")');
  expect(src).toContain('allowConfirmedNavigation.current=true;');
  expect(src).toContain('window.location.assign(url.href)');
  expect(src).toContain("{dialog}");
  expect(src).not.toContain("window.confirm(");
 });
});
