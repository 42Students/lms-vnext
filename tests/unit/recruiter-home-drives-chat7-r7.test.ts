import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 recruiter home and drives round 7",()=>{
it("REC-home-drives-11 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/hr/home/page.tsx");for(const p of ["Open this on your college&apos;s placement address","Your recruiter account works inside one college&apos;s placement site"])expect(s).toContain(p);});
it("REC-home-drives-31 confirms the audited source behavior",()=>{const s=read("src/modules/placements/hr-drive-round-presets.ts");for(const p of ["Test, Technical, HR","Talk, Test, Interview","Test, Group discussion, Interview"])expect(s).toContain(p);});
it("REC-home-drives-34 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");for(const p of ["← Back to Drives","workspace.job.title","applicants.counts.all","Apply by","Live"])expect(s).toContain(p);});
it("REC-home-drives-50 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");for(const p of ["recruiterOfferStatusLabel","With the placement cell","Being verified","Awaiting reply","Reply by"])expect(s).toContain(p);});
it("REC-home-drives-54 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx");for(const p of ["We could not find this drive","It isn&apos;t one of your drives at this college"])expect(s).toContain(p);});
it("REC-home-drives-55 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");for(const p of ["Rounds & interviews","Applicants (","Offers (","Discussion"])expect(s).toContain(p);});
it("REC-home-drives-R07 confirms the audited source behavior",()=>{const s=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");for(const p of ["timeZone:\"Asia/Kolkata\""," IST"])expect(s).toContain(p);});
});
