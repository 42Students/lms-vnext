import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {selectTpoDriveTalkThread} from "@/modules/placements/tpo-drive-talk-selection-model";
const src=(p:string)=>readFileSync(p,"utf8");

describe("TPO original Drive / Talk source and privacy acceptance",()=>{
 it("only selects the exact thread returned by college-authorized drive source",()=>{
  const rows=[{id:"thread-1",recruiter:"One"},{id:"thread-2",recruiter:"Two"}];
  expect(selectTpoDriveTalkThread(rows,null)).toBe(rows[0]);
  expect(selectTpoDriveTalkThread(rows,"thread-2")).toBe(rows[1]);
  expect(selectTpoDriveTalkThread(rows,"elsewhere")).toBeNull();
  expect(selectTpoDriveTalkThread([],null)).toBeNull();
 });
 it("presents scoped recruiter bubbles, quick replies and bounded historical context",()=>{
  const component=src("src/components/tpo/tpo-drive-talk-prototype.tsx");
  const page=src("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  const service=src("src/modules/placements/tpo-drive-discussion-service.ts");
  expect(page).toContain("getTpoDriveDiscussion(context,jobId)");
  expect(page).toContain("<TpoDriveTalkPrototype");
  expect(page).toContain("selectedId={selectedId} requestId={requestId}");
  expect(page).toContain('Array.isArray(value)||(typeof value==="string"&&!uuid.test(value))');
  expect(service).toContain("placementTpoMessageThreads.collegeId,collegeId");
  expect(service).toContain("placementTpoMessageThreads.jobId,jobId");
  expect(service).toContain("order by m.created_at desc,m.id desc limit 3");
  expect(component).toContain("selectTpoDriveTalkThread(threads,selectedId)");
  expect(component).toContain("message.senderType===\"RECRUITER\"");
  expect(component).toContain("<TpoRecruiterMessageReply threadId={selected.id}");
  expect(component).toContain('href={"/tpo/messages/"+encodeURIComponent(selected.id)}');
  expect(component).toContain("Latest three are shown");
  expect(component).not.toContain("Meera Srinivasan");
  expect(component).not.toContain("64 cleared");
 });
 it("keeps internal team notes out of recruiter's thread and reveals scoped change-request states",()=>{
  const component=src("src/components/tpo/tpo-drive-talk-prototype.tsx");
  const page=src("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(component).toContain('href="/tpo/team?filter=drives"');
  expect(component).toContain("Recruiters cannot see your team-only conversation.");
  expect(component).toContain('aria-label="Drive participants and change history"');
  expect(component).toContain('href={root+"/change-requests#change-request-"+encodeURIComponent(item.id)}');
  expect(component).toContain("A chat reply does not apply a requested change.");
  expect(page).toContain("getDriveChangeRequests(context,jobId)");
  expect(page).toContain("getDriveChangeRequestDiscussionContext(context,jobId,requestId)");
  expect(page).toContain("if(error instanceof AuthorizationError)throw error");
  expect(page).toContain("No unrelated recruiter messages were opened.");
 });
 it("does not claim email delivery, unaudited change acceptance or all company access holders",()=>{
  const component=src("src/components/tpo/tpo-drive-talk-prototype.tsx");
  expect(component).toContain("This is a conversation list, not the full company access-grant roster.");
  expect(component).toContain("a recruiter thread message, not a sent email");
  expect(component).toContain("Change requests could not be verified. No request is assumed missing.");
  expect(component).not.toContain("email was delivered");
  expect(component).not.toContain("auto approve");
 });
});
