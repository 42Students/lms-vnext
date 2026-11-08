import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync("src/app/(authenticated)/"+path,"utf8");

test("UX-G065 learner notification history checks membership before bad cursor recovery",()=>{
  const s=read("learn/notifications/history/page.tsx");
  assert.match(s,/hasActiveMembership\(context\)/);
  assert.match(s,/hasMembershipRole\(context,"LEARNER"\)/);
  assert.ok(s.indexOf("hasActiveMembership(context)")<s.indexOf("learnerNotificationHistoryQuerySchema.safeParse"));
  assert.match(s,/No personal notifications were loaded/);
  assert.match(s,/href="\/learn\/notifications\/history"/);
});
test("UX-G065 legacy placement alias and own data-access pages guard roles before presenting content",()=>{
 const s=read("learn/placements/page.tsx");
 assert.match(s,/async function LearnerPlacementsAliasPage/);
 assert.ok(s.indexOf("hasMembershipRole(context")<s.indexOf('redirect("/learn/my-placements")'));
 const data=read("learn/profile/data-access/page.tsx");
 assert.ok(data.indexOf("requireOwnLearnerProfileAccess(context)")<data.indexOf('const raw=(await searchParams)'));
 assert.match(data,/Object.keys\(raw\).every\(key=>key==="tpoPage"\)/);
 assert.match(data,/No private sharing records were loaded/);
 assert.match(data,/View first history page/);
});
test("UX-G065 checklist malformed filters avoid loading private profile details",()=>{
 const s=read("learn/profile/completeness/page.tsx");
 assert.ok(s.indexOf("learnerReadinessQuerySchema.safeParse")<s.indexOf("getOwnLearnerProfileWithRuntime(context)"));
 assert.match(s,/No profile checklist details were loaded/);
 assert.match(s,/href="\/learn\/profile\/completeness"/);
});
test("UX-G028 college event list and detail authorize before invalid data",()=>{
 const list=read("college/activity/page.tsx");
 assert.ok(list.indexOf("hasMembershipRole(context")<list.indexOf("collegeActivityQuerySchema.safeParse"));
 assert.match(list,/hasUserFilters\?"No events match these filters"/);
 assert.match(list,/View all activity/);
 assert.match(list,/Retry activity/);
 const detail=read("college/activity/[eventId]/page.tsx");
 assert.ok(detail.indexOf("hasMembershipRole(context")<detail.indexOf("if(!\/\^\[0-9a-f\]"));
 assert.match(detail,/notFound\(\)/);
 assert.ok(detail.indexOf("notFound()")<detail.indexOf("getCollegeActivityDetail(context"));
});
test("UX-G028 error recovery destinations are valid and remain retryable",()=>{
 for(const [page,href] of [
  ["college/activity/[eventId]/error.tsx","/college/activity"],
  ["college/academics/sections/[sectionId]/error.tsx","/college/academics"],
 ]){
  const s=read(page);
  assert.match(s,/onClick=\{reset\}/);
  assert.ok(s.includes('href="'+href+'"'));
 }
});
