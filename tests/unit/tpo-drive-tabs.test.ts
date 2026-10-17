import {expect,it} from "vitest";
import {tpoDriveMoreTabs,tpoDriveTabs} from "@/modules/placements/tpo-drive-tab-model";
it("navigates all TPO drive workspaces (six primary, seven secondary) using encoded job identifiers",()=>{
 const tabs=tpoDriveTabs("job /&");
 expect(tabs.map(t=>t.label)).toEqual(["Overview","Applicants","Rounds","Offers","Drive day","About this drive"]);
 const more=tpoDriveMoreTabs("job /&");
 expect(more.map(t=>t.label)).toEqual(["Activity","Candidate schedule","Selections","Waitlist","Joining","Change requests","Company sharing"]);
 expect([...tabs,...more].every(t=>t.href.startsWith("/tpo/placements/jobs/job%20%2F%26"))).toBe(true);
});
