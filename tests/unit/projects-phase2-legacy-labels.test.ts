import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const get=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const legacy=get("docs/audit/legacy-copy-A.md");
const shell=get("src/components/shell/shell-model.ts");
const tabs=get("src/components/projects/mentor-project-tabs.tsx");
const page=get("src/app/(authenticated)/mentor/projects/page.tsx");
const detail=get("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");

describe("exact legacy Mentor Projects copy",()=>{
  it("matches sidebar labels, order and legacy learning group",()=>{
    const mentor=shell.split("const mentorItems: ShellNavItem[] = [")[1]?.split("const tpoItems:")[0]??"";
    const labels=[...mentor.matchAll(/label: "([^"]+)"/g)].map(m=>m[1]);
    expect(labels).toEqual(["Projects","Meetings","Notifications"]);
    expect(mentor.match(/group: "learning"/g)?.length).toBe(3);
    for(const label of labels)expect(legacy).toContain('modulename: "'+label+'"');
  });
  it("preserves exact legacy project tabs from the source catalogue",()=>{
    const labels=[...tabs.matchAll(/label: "([^"]+)"/g)].map(m=>m[1]);
    expect(labels).toEqual(["Overview","Board","Sprints & releases","Team & meetings","Performance","Resources","Activity"]);
    // Preserve every legacy tab in its existing order, while independently testing the new Delivery workspace.
    for(const label of labels.filter(label=>label!=="Delivery"))expect(legacy).toContain("prop:label: "+label);
    expect(detail).toContain('delivery: "Overview"');
    expect(detail).toContain('delivery:"Submission package, versions and review decisions."');
    expect(detail).toContain('selectedTab === "delivery"');
  });
  it("uses the original page title and empty states instead of Mentoring Projects",()=>{
    expect(page).toContain('title="Projects"');
    expect(page).toContain("No projects match these filters.");
    expect(page).toContain("No projects assigned yet.");
    expect(detail).toContain('backLabel="Projects"');
    expect(page).not.toContain("Mentoring Projects");
  });
});
