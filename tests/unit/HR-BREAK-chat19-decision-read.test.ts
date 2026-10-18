import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {isVerifiedRecruiterDecisionReadReceipt} from "@/modules/placements/recruiter-decision-read-model";
const id="11111111-1111-4111-8111-111111111111";
describe("HR-BREAK-DECISION-READ-46 verified recruiter decision receipt",()=>{
 it("accepts the actual persisted read status for the exact notification",()=>{
  expect(isVerifiedRecruiterDecisionReadReceipt({
   notification:{id,readAt:"2026-10-18T10:00:00.000Z"},
  },id)).toBe(true);
 });
 it.each([
  null,[],true,{notification:null},{notification:{id,readAt:null}},
  {notification:{id,readAt:"invalid"}},
  {notification:{id:"22222222-2222-4222-8222-222222222222",readAt:"2026-10-18T10:00:00Z"}},
  {notification:{readAt:"2026-10-18T10:00:00Z"}},'<html>Sign in</html>',
 ])("rejects an unconfirmed, foreign or HTML success %j",value=>{
  expect(isVerifiedRecruiterDecisionReadReceipt(value,id)).toBe(false);
 });
 it("prevents rapid double clicks, redirects and short phone targets",()=>{
  const source=readFileSync("src/components/hr/recruiter-decision-read-button.tsx","utf8");
  expect(source).toContain("if(lock.current||complete)return");
  expect(source).toContain("lock.current=true");
  expect(source).toContain('redirect:"error"');
  expect(source).toContain("isVerifiedRecruiterDecisionReadReceipt(payload,id)");
  expect(source).toContain("disabled={busy||complete}");
  expect(source).toContain("min-h-11");
  expect(source).toContain("focus-visible:outline-2");
 });
 it("only marks complete and refreshes after a valid persisted receipt",()=>{
  const source=readFileSync("src/components/hr/recruiter-decision-read-button.tsx","utf8");
  expect(source.indexOf("isVerifiedRecruiterDecisionReadReceipt(payload,id)"))
   .toBeLessThan(source.indexOf("setComplete(true);router.refresh()"));
 });
});
