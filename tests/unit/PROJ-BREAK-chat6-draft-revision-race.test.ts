import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {projectSubmissionDraftInputSchema,updateProjectSubmissionDraftInputSchema} from "@/modules/projects/validation";
import {projectDraftRevisionMatches,nextProjectDraftUpdatedAt} from "@/modules/projects/submission-revision-policy";
const stamp="2026-10-18T12:34:56.789Z";
const draft={summary:"IIT Dharwad final report",sourceUrl:"https://example.org/report"};

describe("PROJ-BREAK-submissions-10 concurrent learner draft revisions",()=>{
  it("requires a well-formed server-issued timestamp for PATCH but keeps POST unchanged",()=>{
    expect(projectSubmissionDraftInputSchema.safeParse(draft).success).toBe(true);
    expect(updateProjectSubmissionDraftInputSchema.safeParse(draft).success).toBe(false);
    expect(updateProjectSubmissionDraftInputSchema.safeParse({...draft,expectedUpdatedAt:stamp}).success).toBe(true);
    for(const invalid of ["not-a-date","2026-10-18","2026-10-18T12:34:56","",0,null]){
      expect(updateProjectSubmissionDraftInputSchema.safeParse({...draft,expectedUpdatedAt:invalid}).success,String(invalid)).toBe(false);
    }
    expect(projectSubmissionDraftInputSchema.safeParse({...draft,expectedUpdatedAt:stamp}).success).toBe(false);
    expect(updateProjectSubmissionDraftInputSchema.safeParse({...draft,expectedUpdatedAt:stamp,anotherCollegeId:"forged"}).success).toBe(false);
  });
  it("an old browser tab is rejected after a parallel edit, even when calls share the same wall-clock millisecond",()=>{
    const first=new Date(stamp);
    expect(projectDraftRevisionMatches(first,stamp)).toBe(true);
    const second=nextProjectDraftUpdatedAt(first,new Date(stamp));
    expect(second.getTime()).toBe(first.getTime()+1);
    expect(projectDraftRevisionMatches(second,stamp)).toBe(false);
    expect(projectDraftRevisionMatches(second,second.toISOString())).toBe(true);
    const third=nextProjectDraftUpdatedAt(second,new Date("2026-10-18T12:34:56.700Z"));
    expect(third.getTime()).toBe(second.getTime()+1);
    expect(projectDraftRevisionMatches(third,second.toISOString())).toBe(false);
  });
  it("future, malformed or nonfinite clocks never silently equate",()=>{
    expect(projectDraftRevisionMatches(new Date(stamp),"not-date")).toBe(false);
    expect(projectDraftRevisionMatches(new Date(Number.NaN),stamp)).toBe(false);
    expect(()=>nextProjectDraftUpdatedAt(new Date(Number.NaN))).toThrow("Invalid project draft revision clock");
  });
  it("service verifies under PostgreSQL project/submission row locks before mutating attachments and issuing activity",()=>{
    const source=readFileSync("src/modules/projects/submission-service.ts","utf8");
    const body=source.slice(source.indexOf("export async function updateProjectSubmissionDraft("),
      source.indexOf("export async function submitProjectSubmission("));
    expect(body).toContain("updateProjectSubmissionDraftInputSchema.parse(rawInput)");
    expect(body).toContain('eq(projectSubmissions.projectId, scope.project.id)');
    expect(body).toContain('.for("update")');
    expect(body).toContain('if (submission.status !== "DRAFT")');
    expect(body).toContain("!projectDraftRevisionMatches(submission.updatedAt,input.expectedUpdatedAt)");
    expect(body).toContain('throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT")');
    expect(body).toContain("updatedAt: nextProjectDraftUpdatedAt(submission.updatedAt)");
    expect(body.indexOf("!projectDraftRevisionMatches(")).toBeLessThan(body.indexOf("ATTACHMENTS_CHANGED"));
  });
  it("learner manual-save and autosave use the freshest acknowledged timestamp, never stale initial props",()=>{
    const source=readFileSync("src/components/projects/project-final-delivery-controls.tsx","utf8");
    const learner=source.slice(source.indexOf("export function LearnerFinalDeliveryControl"),
      source.indexOf("export function FinalReviewControl"));
    expect(learner).toContain("const lastSavedUpdatedAt=useRef(");
    expect(learner).toContain("expectedUpdatedAt:lastSavedUpdatedAt.current");
    expect(learner).toContain("lastSavedUpdatedAt.current=acknowledgedDraftRevision(result)");
    expect(learner).toContain("Could not confirm the draft revision. Refresh before editing again.");
    expect(learner).toContain("const pendingRef = useRef(false)");
  });
});
