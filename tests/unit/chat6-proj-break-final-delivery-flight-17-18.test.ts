import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=()=>readFileSync("src/components/projects/project-final-delivery-controls.tsx","utf8");
describe("PROJ-BREAK-reviews-17 / evaluation-18 rapid consecutive submissions",()=>{
 it("locks Mentor review in the same tick before the first mutation and unlocks even on failure",()=>{
  const code=source();
  const review=code.slice(code.indexOf("export function FinalReviewControl("),code.indexOf("type EvaluationRow"));
  expect(review).toContain("const reviewInFlight=useRef(false)");
  expect(review).toContain("pending || reviewInFlight.current || staleReview");
  expect(review).toContain("reviewInFlight.current=true");
  expect(review).toContain("reviewInFlight.current=false");
  expect(review.indexOf("reviewInFlight.current=true")).toBeLessThan(review.indexOf("await projectMutation("));
  expect(review.indexOf("reviewInFlight.current=false")).toBeGreaterThan(review.indexOf("} finally {"));
  expect(review).toContain("useProjectEditorDiscardGuard");
  expect(review).toContain("setStaleReview(true)");
 });
 it("locks evaluation awards synchronously and retains criteria after API rejection",()=>{
  const code=source();
  const evaluation=code.slice(code.indexOf("export function ProjectEvaluationControl("));
  expect(evaluation).toContain("const evaluationInFlight=useRef(false)");
  expect(evaluation).toContain("if (!valid || evaluationInFlight.current) return;");
  expect(evaluation).toContain("evaluationInFlight.current=true");
  expect(evaluation).toContain("evaluationInFlight.current=false");
  expect(evaluation.indexOf("evaluationInFlight.current=true")).toBeLessThan(evaluation.indexOf("await projectMutation("));
  expect(evaluation).toContain("setError(finalDeliveryUserError(caught))");
  expect(evaluation).toContain("useProjectEditorDiscardGuard");
  expect(evaluation).not.toContain("setRows([emptyEvaluationRow()]);\n    } catch");
 });
 it("final submit rechecks readiness and maps unexpected errors to safe copy",()=>{
  const code=source();
  const learner=code.slice(code.indexOf("export function LearnerFinalDeliveryControl("),code.indexOf("export function FinalReviewControl("));
  expect(learner).toContain("if(!canSubmitDraft)");
  expect(learner).toContain("savedDeliverySubmissionReadiness(currentPayload(),lastSavedSnapshot.current)");
  expect(learner).toContain("description:finalDeliveryUserError(caught)");
  expect(learner).toContain("const pendingRef = useRef(false)");
 });
});
