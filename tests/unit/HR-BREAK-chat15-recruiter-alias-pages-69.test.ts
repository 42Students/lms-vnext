import {describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({redirect:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));

import RecruiterIndex from "@/app/(authenticated)/recruiter/page";
import RecruiterColleges from "@/app/(authenticated)/recruiter/colleges/page";
import RecruiterCalendar from "@/app/(authenticated)/recruiter/calendar/page";
import HrCalendar from "@/app/(authenticated)/hr/calendar/page";
import RecruiterCompany from "@/app/(authenticated)/recruiter/company/page";
import HrCompany from "@/app/(authenticated)/hr/company/page";
import RecruiterDrives from "@/app/(authenticated)/recruiter/drives/page";
import HrDrives from "@/app/(authenticated)/hr/drives/page";
import RecruiterJob from "@/app/(authenticated)/recruiter/drives/[jobId]/page";
import HrJob from "@/app/(authenticated)/hr/placements/jobs/[jobId]/page";
import RecruiterSlots from "@/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page";
import HrSlots from "@/app/(authenticated)/hr/drives/[jobId]/interview-slots/page";
import RecruiterMessages from "@/app/(authenticated)/recruiter/drives/[jobId]/messages/page";
import HrMessages from "@/app/(authenticated)/hr/drives/[jobId]/messages/page";
import RecruiterRoundEditor from "@/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page";
import HrRoundEditor from "@/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page";
import RecruiterRemoveRound from "@/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page";
import HrRemoveRound from "@/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page";
import RecruiterNewDrive from "@/app/(authenticated)/recruiter/drives/new/page";
import HrNewDrive from "@/app/(authenticated)/hr/drives/new/page";
import RecruiterProposals from "@/app/(authenticated)/recruiter/drives/proposals/page";
import HrProposals from "@/app/(authenticated)/hr/drives/proposals/page";
import RecruiterOutside from "@/app/(authenticated)/recruiter/drives/recorded-outside/page";
import HrOutside from "@/app/(authenticated)/hr/drives/recorded-outside/page";
import RecruiterHome from "@/app/(authenticated)/recruiter/home/page";
import HrHome from "@/app/(authenticated)/hr/home/page";
import RecruiterInbox from "@/app/(authenticated)/recruiter/messages/page";
import HrInbox from "@/app/(authenticated)/hr/conversations/page";
import RecruiterProfile from "@/app/(authenticated)/recruiter/profile/page";
import HrProfile from "@/app/(authenticated)/hr/profile/page";

describe("HR-RECRUITER-PAGES-69: legacy aliases use the exact authorized HR server pages",()=>{
 it.each([
  ["calendar",RecruiterCalendar,HrCalendar],["company",RecruiterCompany,HrCompany],
  ["drives",RecruiterDrives,HrDrives],["job detail",RecruiterJob,HrJob],
  ["interview slots",RecruiterSlots,HrSlots],["drive messages",RecruiterMessages,HrMessages],
  ["round editor",RecruiterRoundEditor,HrRoundEditor],
  ["remove round",RecruiterRemoveRound,HrRemoveRound],
  ["new drive",RecruiterNewDrive,HrNewDrive],["proposals",RecruiterProposals,HrProposals],
  ["recorded outside",RecruiterOutside,HrOutside],
  ["home",RecruiterHome,HrHome],["inbox",RecruiterInbox,HrInbox],
  ["profile",RecruiterProfile,HrProfile],
 ])("%s alias cannot bypass the canonical page's auth and tenant boundary",
  (_name,alias,canonical)=>{
   expect(alias).toBe(canonical);
  });
 it("both legacy landing pages return to Today, not to an unscoped college directory",()=>{
  mocks.redirect.mockImplementation(()=>{throw new Error("REDIRECT");});
  expect(()=>RecruiterIndex()).toThrow("REDIRECT");
  expect(()=>RecruiterColleges()).toThrow("REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledTimes(2);
  expect(mocks.redirect).toHaveBeenNthCalledWith(1,"/hr/home");
  expect(mocks.redirect).toHaveBeenNthCalledWith(2,"/hr/home");
 });
});
