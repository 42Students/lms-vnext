import {expect,it} from "vitest";
import {tpoDriveTabs} from "@/modules/placements/tpo-drive-tab-model";
it("navigates all six TPO drive workspaces using encoded job identifiers",()=>{
 const tabs=tpoDriveTabs("job /&");
 expect(tabs.map(t=>t.label)).toEqual(["Overview","Applicants","Rounds","Offers","Joining","Company sharing"]);
 expect(tabs.every(t=>t.href.startsWith("/tpo/placements/jobs/job%20%2F%26"))).toBe(true);
});
