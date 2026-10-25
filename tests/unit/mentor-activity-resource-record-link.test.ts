import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Mentor activity resource record links",()=>{
 it("links resource events to a specific authorized resource anchor",()=>{
  const activity=read("src/components/projects/project-activity-filtered-list.tsx");
  expect(activity).toContain('event.subjectType==="project_resource"&&safeId');
  expect(activity).toContain('?tab=resources#mentor-resource-');
  const listing=read("src/components/projects/project-resource-list.tsx");
  expect(listing).toContain('id={"mentor-resource-"+resource.id}');
  expect(listing).toContain('setShowEarlier(true)');
  expect(listing).toContain('setStatus("ALL")');
  expect(listing).toContain('rows.some(row=>row.id===match[1])');
 });
});