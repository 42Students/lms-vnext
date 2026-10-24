import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("Mentor Home portfolio identity and counts",()=>{
 const service=read("src/modules/projects/mentor-project-team-size-service.ts");
 const page=read("src/app/(authenticated)/mentor/projects/page.tsx");
 const home=read("src/components/projects/mentor-prototype-home.tsx");
 it("counts portfolio-wide teams instead of only currently paginated rows",()=>{
  expect(service).toContain("verifiedRows??await listMyProjectInstances(context)");
  expect(service).toContain("const ids=[...new Set(authorized.map(row=>row.project.id))]");
  expect(service).toContain("teamCount:ids.length");
  expect(service).toContain("membershipCount:[...sizes.values()]");
  expect(page).toContain("teamCount={learnerCounts.teamCount}");
  expect(page).toContain("membershipCount={learnerCounts.membershipCount}");
 });
 it("gives real, deduplicated course labels from Mentor assignments",()=>{
  expect(service).toContain("const courseLabels=[...new Set(authorized.map");
  expect(page).toContain("courseLabels={learnerCounts.courseLabels}");
  expect(home).toContain("No course labels are recorded");
 });
 it("uses own signed-in name and does not invent a learner team lead",()=>{
  expect(page).toContain("eq(users.id,context.user.id)");
  expect(home).toContain("mentorHomeGreeting(nowIso,mentorName)");
  expect(home).toContain("No student lead is inferred");
  expect(home).toContain("/mentor/projects?status=ARCHIVED");
 });
});
