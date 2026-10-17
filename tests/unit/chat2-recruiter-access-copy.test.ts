import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Recruiter access and notification wording",()=>{
 it("REC-calendar-messages-profile-R03 never says conversations are unavailable while the real inbox exists",()=>{
  const notification=src("src/app/(authenticated)/hr/notifications/page.tsx");
  const messages=src("src/app/(authenticated)/hr/messages/page.tsx");
  expect(notification).toContain("Conversations and replies are available under Messages.");
  expect(notification).not.toContain("Conversation threads and replies remain unavailable");
  expect(messages).toContain('from "@/app/(authenticated)/hr/conversations/page"');
 });
 it("REC-calendar-messages-profile-16 describes ended college access without exposing a foreign thread",()=>{
  const list=src("src/app/(authenticated)/hr/conversations/page.tsx");
  const detail=src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
  expect(list).toContain("Your access to this college has ended or was removed. Ask the placement cell to give it again.");
  expect(detail).toContain("if(error instanceof TpoMessagingError)notFound()");
 });
 it("REC-calendar-messages-profile-48 explains the college placements address on no-access calendar",()=>{
  const cal=src("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(cal).toContain("Open this on your college&apos;s placement address");
  expect(cal).toContain("Return to Today");
 });
});
