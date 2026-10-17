import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {canPageMentorProjectList} from "../../src/modules/projects/mentor-paged-project-list-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Mentor project database pagination",()=>{
 it("MEN-projects-meetings-10 pages common filters in SQL and only falls back for advanced attention/sorts",()=>{
  expect(canPageMentorProjectList({status:"CURRENT",attention:undefined,work:undefined,sort:"RECENT"})).toBe(true);
  expect(canPageMentorProjectList({status:"ARCHIVED",attention:undefined,work:undefined,sort:"TITLE"})).toBe(true);
  expect(canPageMentorProjectList({status:"READY",attention:undefined,work:undefined,sort:"RECENT"})).toBe(false);
  expect(canPageMentorProjectList({status:undefined,attention:"MENTOR_REVIEW",work:undefined,sort:"RECENT"})).toBe(false);
  const sql=read("src/modules/projects/mentor-paged-project-list-service.ts");
  const page=read("src/app/(authenticated)/mentor/projects/page.tsx");
  expect(sql).toContain("count(*)::int");
  expect(sql).toContain(".limit(pageSize).offset((page-1)*pageSize)");
  expect(sql).toContain('eq(projectMembers.role,"MENTOR")');
  expect(sql).toContain("eq(collegeMemberships.userId,context.user.id)");
  expect(sql).toContain('isNull(projectMembers.endedAt)');
  expect(page).toContain("listPagedMentorProjects(context,query)");
  expect(page).toContain("getMentorProjectTeamSizes(context,paged?allRows:undefined)");
  expect(page).toContain("const rows = paged?filtered:filtered.slice(");
 });
});
