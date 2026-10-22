import {describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {nextHrProposalAttempt} from "@/modules/placements/hr-drive-proposal-attempt-model";

describe("HR-BREAK-double-submit-01: recruiter formal drive submission",()=>{
 it("uses the same idempotency key for a retry of the exact request, but rotates on edited content",()=>{
  const generate=vi.fn().mockReturnValueOnce("request-1").mockReturnValueOnce("request-2");
  const first=nextHrProposalAttempt(null,"college-a|role-a|draft-v1",generate);
  const retry=nextHrProposalAttempt(first,"college-a|role-a|draft-v1",generate);
  expect(retry).toBe(first);
  expect(retry.submissionId).toBe("request-1");
  expect(generate).toHaveBeenCalledTimes(1);
  const edited=nextHrProposalAttempt(retry,"college-a|role-a|draft-v2",generate);
  expect(edited.submissionId).toBe("request-2");
  expect(edited).not.toBe(retry);
  expect(generate).toHaveBeenCalledTimes(2);
 });
 it("has a synchronous in-flight ref guard, not only delayed React state, and preserves retries",()=>{
  const source=readFileSync("src/components/hr/hr-drive-draft-form.tsx","utf8");
  expect(source).toContain("const submittingRef=useRef(false)");
  expect(source).toContain("if(submitting||jdUploading||jdPendingKey||submittingRef.current||submittedRef.current)return");
  expect(source).toContain("submittingRef.current=true");
  expect(source).toContain("submittingRef.current=false");
  expect(source).toContain("submissionId:next.submissionId");
  expect(source).toContain("expectedUpdatedAt:fixUpdatedAt");
  expect(source).toContain("nextHrProposalAttempt(attempted.current,signature");
  expect(source).toContain("Your draft is preserved; check Drives before resending.");
  expect(source).toContain("Your access to this college has ended.");
 });
});
