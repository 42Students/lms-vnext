import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("REC-calendar-messages-profile-08 conversations are the Messages inbox",()=>{
 it("opens conversation threads from the canonical sidebar Messages route",()=>{
  expect(read("src/app/(authenticated)/hr/messages/page.tsx")).toContain('/hr/conversations/page');
  expect(read("src/app/(authenticated)/recruiter/messages/page.tsx")).toContain('/hr/conversations/page');
 });
 it("keeps the drive-notification inbox on a separate route",()=>{
  const notices=read("src/app/(authenticated)/hr/notifications/page.tsx");
  expect(notices).toContain("listHrNotifications");
  expect(notices).toContain('action="/hr/notifications"');
 });
});
