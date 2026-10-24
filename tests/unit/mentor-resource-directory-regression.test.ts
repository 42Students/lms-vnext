import {describe,expect,it} from "vitest";
import {mentorResourceDirectory,mentorResourceDirectoryCsv,
 mentorResourceDirectoryHref,mentorResourceDirectoryQuerySchema,
 parseMentorResourceDirectorySearch,mentorResourceEarlierScope}
 from "@/modules/projects/mentor-resource-directory-model";
const projectId="11111111-1111-4111-8111-111111111111";
const row={id:"22222222-2222-4222-8222-222222222222",
 title:"File for demo",description:"Testing",url:"https://example.org/demo",
 required:true,sequence:0};
describe("Mentor resource metadata directory contract",()=>{
 it("retains strict parsing, scoped href and pagination after pinned-resource helpers",()=>{
  const parsed=parseMentorResourceDirectorySearch(projectId,
    {required:"REQUIRED",page:"2"});
  expect(parsed).not.toBeNull();
  expect(parsed?.required).toBe("REQUIRED");
  expect(mentorResourceDirectoryHref(parsed!)).toContain("page=2");
  expect(parseMentorResourceDirectorySearch(projectId,{unexpected:"yes"})).toBeNull();
  expect(mentorResourceDirectoryQuerySchema.safeParse({projectId,required:"NOPE"}).success)
   .toBe(false);
 });
 it("never exports unsafe links and keeps metadata bounded",()=>{
  const query=mentorResourceDirectoryQuerySchema.parse({projectId});
  const data=mentorResourceDirectory([row,{...row,id:projectId,url:"javascript:alert(1)",
    title:"Unsafe"}],query);
  expect(data.registered).toBe(2);
  expect(data.linkableCount).toBe(1);
  expect(data.total).toBe(2);
  expect(data.items.find(x=>x.title==="Unsafe")?.safeUrl).toBeNull();
  const csv=mentorResourceDirectoryCsv(data.exportItems,0);
  expect(csv).toContain("Resource ID,Title");
  expect(csv).not.toContain("javascript:");
 });
 it("keeps pinned completed-sprint resources visible alongside the legacy directory",()=>{
  const x=mentorResourceEarlierScope([{id:"pinned",pinned:true,sprintId:projectId},
    {id:"hidden",pinned:false,sprintId:projectId}],new Set([projectId]),true);
  expect(x.earlierCount).toBe(1);
  expect(x.visibleRows.map(y=>y.id)).toEqual(["pinned"]);
 });
});
