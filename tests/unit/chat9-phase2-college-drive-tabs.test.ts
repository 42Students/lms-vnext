import {describe,expect,it} from "vitest";
import {COLLEGE_LEGACY_DRIVE_TABS,collegeDriveDetailTabs,collegeDriveTabActive} from "@/modules/placements/college-drive-legacy-tabs";
const id="7b515d51-4f53-4d09-a606-365c44cd77cb";
describe("College Admin exact legacy drive navigation",()=>{
  it("matches the legacy labels and order without inventing a fifth tab",()=>{
    expect(COLLEGE_LEGACY_DRIVE_TABS.map(tab=>tab.label)).toEqual([
      "Overview","Applications","Schedule","Settings",
    ]);
    expect(collegeDriveDetailTabs(id).map(tab=>tab.href)).toEqual([
      "/college/placements/jobs/"+id+"/overview",
      "/college/placements/jobs/"+id+"/applications",
      "/college/placements/jobs/"+id+"/interviews",
      "/college/placements/jobs/"+id+"/settings",
    ]);
  });
  it("treats nested pages as active and does not match a similar prefix",()=>{
    const href=collegeDriveDetailTabs(id)[1]!.href;
    expect(collegeDriveTabActive(href,href)).toBe(true);
    expect(collegeDriveTabActive(href+"/export",href)).toBe(true);
    expect(collegeDriveTabActive(href+"-other",href)).toBe(false);
  });
});
