import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const list=readFileSync("src/modules/placements/tpo-configuration-read-service.ts","utf8");
const write=readFileSync("src/modules/placements/tpo-prep-readiness-write-service.ts","utf8");
const derive=readFileSync("src/modules/placements/tpo-prep-readiness-derived-service.ts","utf8");
const page=readFileSync("src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx","utf8");
const reader=list.slice(list.indexOf("export async function listTpoPrepCourses("),
 list.indexOf("export async function listPlacementJobTypeChoices("));
const settings=list.slice(list.indexOf("export async function getTpoPrepReadiness("),
 list.indexOf("export async function listTpoPrepCourses("));

test("DB034 active sibling-college courses share an exact persisted organization and a locked TPO actor",()=>{
 for(const text of [reader,write,derive]){
  assert.match(text,/\.innerJoin\(colleges,eq\(colleges\.id,departments\.collegeId\)\)/);
  assert.match(text,/eq\(colleges\.status,"ACTIVE"\)/);
  assert.match(text,/isNull\(departments\.archivedAt\)/);
  assert.match(text,/eq\(courses\.status,"ACTIVE"\)/);
  assert.match(text,/eq\(courses\.enabled,true\)/);
  assert.match(text,/isNull\(courses\.deletedAt\)/);
 }
 assert.match(reader,/eq\(colleges\.organizationId,college\.organizationId\)/);
 assert.match(write,/eq\(colleges\.organizationId,college\.organizationId\)/);
 assert.match(derive,/eq\(colleges\.organizationId,scope\.organizationId\)/);
 for(const text of [reader,write,derive])
  assert.match(text,/assertPersistedPlatformPermission\(tx,(?:ctx|context),"placements\.manage"/);
 assert.match(derive,/hasEveryScopedTpoPrepLearner\(learners,enrolled\)/);
 assert.match(derive,/eq\(collegeMemberships\.collegeId,collegeId\)/);
});

test("DB034 saved course selections and policy share one transaction and monotonic CAS",()=>{
 assert.match(write,/placementTableExists\("placement_tpo_prep_courses"\)/);
 assert.match(write,/return getDb\(\)\.transaction\(async tx=>\{/);
 assert.match(write,/eq\(placementTpoPrepCourses\.collegeId,collegeId\)/);
 assert.match(write,/normalizedMatches&&tpoPrepReadinessSamePolicy\(current\.config,input\)/);
 const save=write.indexOf("const [saved]=await tx.insert(placementTpoPrepReadiness)");
 const del=write.indexOf("await tx.delete(placementTpoPrepCourses)");
 const insert=write.indexOf("await tx.insert(placementTpoPrepCourses).values(");
 const audit=write.indexOf("await tx.insert(activityEvents)");
 assert.ok(save>0&&del>save&&insert>del&&audit>insert);
 assert.match(write,/createdByUserId:context\.user\.id/);
 assert.match(write,/eq\(placementTpoPrepCourses\.collegeId,collegeId\)/);
 assert.match(write,/greatest\(clock_timestamp\(\)/);
});

test("DB034 read and learner outcomes fail closed on divergent JSON and normalized selections",()=>{
 assert.match(settings,/placementTableExists\("placement_tpo_prep_courses"\)/);
 assert.match(settings,/normalizedCourseIds\.length===config\.data\.courseIds\.length/);
 assert.match(settings,/config\.data\.courseIds\.every\(id=>normalizedCourseIds\.includes\(id\)\)/);
 assert.match(settings,/selectionSynchronized,selectionReady/);
 assert.match(derive,/stored\.selectionSynchronized===false/);
 assert.match(page,/data\.selectionSynchronized===false/);
 assert.match(derive,/inArray\(courseOfferings\.cohortId,requestedCohortIds\)/);
 assert.match(derive,/isNotNull\(learnerContentProgress\.completedAt\)/);
});
