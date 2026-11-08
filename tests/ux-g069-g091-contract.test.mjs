import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const root="src/app/(authenticated)/";
const read=(p)=>readFileSync(root+p,"utf8");

test("UX-G069: every legacy Mentor bookmark checks real membership before forwarding",()=>{
 const routes=[
  "mentor/allQuizzes/page.tsx",
  "mentor/fileExplorer/page.tsx",
  "mentor/courses/page.tsx",
  "mentor/contacts/[[...contactsTab]]/page.tsx",
  "mentor/courses/[courseId]/[[...courseTab]]/page.tsx",
 ];
 for(const route of routes){
  const s=read(route);
  const gate=s.indexOf('hasActiveMembership(context)');
  const target=s.lastIndexOf('redirect("/mentor/projects")');
  assert.ok(gate>=0 && gate<target,route+" must authorize before routing");
  assert.match(s,/hasMembershipRole\(context,"MENTOR"\)/);
  assert.match(s,/redirect\("\/dashboard"\)/);
  assert.match(s,/async function MentorLegacyRedirect/);
 }
});
test("UX-G069: Mentor calendar authorizes before rejecting filters",()=>{
 const s=read("mentor/calendar/page.tsx");
 assert.ok(s.indexOf('hasActiveMembership(context)')<s.indexOf('mentorCalendarFiltersSchema.safeParse'));
 assert.match(s,/No meeting information was loaded/);
 assert.match(s,/href="\/mentor\/calendar"/);
 assert.equal((s.match(/const context\s*=\s*await getCurrentRequestContext\(\)/g)||[]).length,1);
});
test("UX-G091: Faculty calendar and contact directory deny before displaying malformed selector",()=>{
 for(const route of ["teacher/calendar/page.tsx","teacher/contacts/[contactsTab]/page.tsx"]){
  const s=read(route),gate=s.indexOf("hasActiveMembership(context)");
  const invalid=route.includes("calendar")?s.indexOf("facultyMonthQuerySchema.safeParse"):s.indexOf("parseFacultyContactsQuery(raw)");
  assert.ok(gate>=0&&invalid>gate,route+" guard ordering");
  assert.match(s,/hasMembershipRole\(context,"FACULTY"\)/);
  assert.match(s,/No (class schedule data|contact records) was loaded/);
  assert.equal((s.match(/const context\s*=\s*await getCurrentRequestContext\(\)/g)||[]).length,1);
 }
});
test("UX-G091: duplicate Faculty quiz shortcut cannot be silently preselected",()=>{
 const s=read("teacher/allQuizzes/page.tsx");
 assert.match(s,/typeof rawId==="string"/);
 assert.match(s,/const invalidShortcut=rawId!==undefined&&!initialQuizId/);
 assert.match(s,/That quiz shortcut is invalid/);
 assert.match(s,/Clear shortcut/);
});
