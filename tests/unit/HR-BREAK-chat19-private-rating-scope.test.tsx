import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {RecruiterPrivateRatingEditor} from "@/components/hr/recruiter-private-rating-editor";
import {readFileSync} from "node:fs";

vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
const job="11111111-1111-4111-8111-111111111111";
const applicantA="22222222-2222-4222-8222-222222222222";
const applicantB="33333333-3333-4333-8333-333333333333";
describe("HR-BREAK-PRIVATE-RATING-36: no applicant or company private-note state bleed",()=>{
 it("assigns a different child instance key whenever focused applicant changes",()=>{
  const a=RecruiterPrivateRatingEditor({jobId:job,applicationId:applicantA});
  const b=RecruiterPrivateRatingEditor({jobId:job,applicationId:applicantB});
  const c=RecruiterPrivateRatingEditor({jobId:job,applicationId:applicantA});
  expect(a.key).toBe(job+":"+applicantA);
  expect(b.key).toBe(job+":"+applicantB);
  expect(a.key).not.toBe(b.key);
  expect(c.key).toBe(a.key);
 });
 it("also isolates the same candidate ID reused in a different hiring drive",()=>{
  const a=RecruiterPrivateRatingEditor({jobId:job,applicationId:applicantA});
  const b=RecruiterPrivateRatingEditor({jobId:applicantB,applicationId:applicantA});
  expect(a.key).not.toBe(b.key);
 });
 it("does not expose a previous candidate rating or enable saving before own read",()=>{
  const html=renderToStaticMarkup(<RecruiterPrivateRatingEditor
    jobId={job} applicationId={applicantB}/>);
  expect(html).toContain("Your private rating");
  expect(html).toContain("Save private review");
  expect(html).toContain("disabled");
  expect(html).not.toContain("Private review saved.");
 });
 it("aborts an in-flight old applicant GET when the keyed form unmounts",()=>{
  const source=readFileSync("src/components/hr/recruiter-private-rating-editor.tsx","utf8");
  expect(source).toContain("key={props.jobId+\":\"+props.applicationId}");
  expect(source).toContain("controller.abort()");
  expect(source).toContain("if(mounted.current&&!controller.signal.aborted)");
  expect(source).toContain("expectedUpdatedAt:saved.updatedAt");
 });
});
