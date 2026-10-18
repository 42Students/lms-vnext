import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {savedDeliverySubmissionReadiness} from "@/modules/projects/saved-delivery-submission-readiness";
const snapshot=(value:unknown)=>JSON.stringify(value);
const base={summary:"Release report",sourceUrl:"https://git.example.test/repository",
  demoUrl:undefined,notes:undefined,attachments:[]};

describe("IIT Dharwad learner final-delivery concurrency and unsaved-input breaker",()=>{
 it("PROJ-BREAK-submissions-07 rejects unsaved edits even when the previous server snapshot was valid",()=>{
  const acknowledged=snapshot(base);
  expect(savedDeliverySubmissionReadiness(base,acknowledged)).toBe("READY");
  expect(savedDeliverySubmissionReadiness({...base,summary:"Different unsaved report"},acknowledged)).toBe("UNSAVED");
  expect(savedDeliverySubmissionReadiness({...base,attachments:[{kind:"FILE"}]},acknowledged)).toBe("UNSAVED");
  expect(savedDeliverySubmissionReadiness(base,"not JSON")).toBe("UNSAVED");
  expect(savedDeliverySubmissionReadiness(base,snapshot({}))).toBe("UNSAVED");
 });
 it("PROJ-BREAK-submissions-07 rejects summary-only and non-file link-only evidence",()=>{
  const summary={...base,sourceUrl:undefined};
  const link={...summary,attachments:[{kind:"LINK",url:"https://example.test"}]};
  expect(savedDeliverySubmissionReadiness(summary,snapshot(summary))).toBe("MISSING_EVIDENCE");
  expect(savedDeliverySubmissionReadiness(link,snapshot(link))).toBe("MISSING_EVIDENCE");
  const blank={...base,summary:" "};
  expect(savedDeliverySubmissionReadiness(blank,snapshot(blank))).toBe("MISSING_EVIDENCE");
 });
 it("PROJ-BREAK-submissions-07 accepts the persisted successful autosave with file evidence",()=>{
  const file={...base,sourceUrl:undefined,attachments:[{kind:"FILE",fileId:"11111111-1111-4111-8111-111111111111"}]};
  expect(savedDeliverySubmissionReadiness(file,snapshot(file))).toBe("READY");
  const demo={...base,sourceUrl:undefined,demoUrl:"https://example.org/demo"};
  expect(savedDeliverySubmissionReadiness(demo,snapshot(demo))).toBe("READY");
 });
 it("PROJ-BREAK-submissions-08/09 coordinates manual save, autosave and final submission behind one ref lock",()=>{
  const source=readFileSync("src/components/projects/project-final-delivery-controls.tsx","utf8");
  const learner=source.slice(0,source.indexOf("export function FinalReviewControl"));
  expect(learner).toContain("const pendingRef = useRef(false)");
  expect(learner).toContain("if (pendingRef.current) return");
  expect(learner).toContain("if(pendingRef.current)return");
  expect(learner).toContain("pendingRef.current=true");
  expect(learner).toContain("pendingRef.current=false");
  expect(learner).toContain("lastSavedSnapshot.current");
  expect(learner).toContain("savedDeliverySubmissionReadiness(currentPayload(),lastSavedSnapshot.current)");
  expect(learner).toContain("const persisted=JSON.parse(lastSavedSnapshot.current)");
  expect(learner).not.toContain("window.confirm(");
  expect(learner).toContain("title=\"Submit on behalf of your team?\"");
  expect(learner).toContain("The final delivery is shared with your project team and cannot be edited while it awaits review.");
  expect(learner).toContain("onConfirm={()=>{void submitDraft(true);}}");
  expect(learner).toContain("onClick={()=>{void submitDraft();}}");
 });
});