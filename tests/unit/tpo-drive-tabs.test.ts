import {expect,it} from "vitest";
import {tpoDriveMoreTabs,tpoDriveTabs} from "@/modules/placements/tpo-drive-tab-model";
it("TPO-inbox-team-07 navigates all drive workspaces including Discussion (seven primary, seven secondary) using encoded job identifiers",()=>{
 const tabs=tpoDriveTabs("job /&");
 expect(tabs.map(t=>t.label)).toEqual(["Overview","Applicants","Rounds","Offers","Drive day","Discussion","About this drive"]);
 expect(tabs.find(t=>t.label==="Discussion")?.href).toBe("/tpo/placements/jobs/job%20%2F%26/discussion");
 const more=tpoDriveMoreTabs("job /&");
 expect(more.map(t=>t.label)).toEqual(["Activity","Candidate schedule","Selections","Waitlist","Joining","Change requests","Company sharing"]);
 expect([...tabs,...more].every(t=>t.href.startsWith("/tpo/placements/jobs/job%20%2F%26"))).toBe(true);
});
