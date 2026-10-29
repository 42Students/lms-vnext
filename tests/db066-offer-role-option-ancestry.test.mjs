import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync("src/modules/placements/offer-service.ts","utf8");
const groups=[...source.matchAll(/\.innerJoin\(\s*placementJobRoleOptions,/g)].map(m=>source.slice(m.index,m.index+560));
test("DB066 offer lifecycle keeps every matched role option within application job",()=>{
 assert.equal(groups.length,6,"unexpected offer role-option read path added/removed");
 for(const [index,section] of groups.entries()){
  assert.match(section,/and\(eq\(placementJobRoleOptions\.id,placementApplications\.roleOptionId\),\s*eq\(placementJobRoleOptions\.jobId,placementApplications\.jobId\)\)/,
   "unsafe same-job role-option read path #"+(index+1));
 }
});
test("DB066 no remaining offer role-option joins match only an unscoped option ID",()=>{
 assert.doesNotMatch(source,/\.innerJoin\(\s*placementJobRoleOptions,\s*eq\(\s*placementJobRoleOptions\.id,\s*placementApplications\.roleOptionId/);
});
