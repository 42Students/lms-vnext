import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const manage=readFileSync("src/modules/placements/company-share/manage-service.ts","utf8");
const publicView=readFileSync("src/modules/placements/company-share/public-service.ts","utf8");
const start=manage.indexOf("export async function issueTpoCompanyApplicantShare(");
const end=manage.indexOf("export async function listTpoCompanyApplicantShares(",start);
assert.ok(start>=0&&end>start,"Share issue transaction not found");
const issue=manage.slice(start,end);

test("default share requires authorization table before distributing token",()=>{
 assert.match(issue,/if\(!await placementTableExists\("placement_company_share_selections"\)\)/);
 assert.match(issue,/const requestedIds=parsed\.selectedApplicationIds\?\?null/);
 assert.match(issue,/requestedIds\?inArray\(placementApplications\.id,requestedIds\):undefined/);
});

test("snapshot is bounded and current shortlist is revalidated under one transaction",()=>{
 const checks=[
  "eq(placementApplications.jobId,job.id)",
  'eq(placementApplications.status,"SUBMITTED")',
  'eq(placementApplicationScreenings.status,"SHORTLISTED")',
  'eq(collegeMemberships.collegeId,college.id)',
  'eq(collegeMemberships.status,"ACTIVE")',
  'eq(users.platformStatus,"ACTIVE")',
 ];
 for(const check of checks)assert.ok(issue.includes(check),"Missing share audience rule: "+check);
 assert.match(issue,/\.orderBy\(placementApplications\.id\)\s*\.limit\(201\)/);
 assert.match(issue,/if\(eligible\.length>200 \|\|\s*\(requestedIds&&eligible\.length!==requestedIds\.length\)\)/);
 assert.match(issue,/const selectedIds=eligible\.map\(candidate=>candidate\.id\)/);
 const transaction=issue.indexOf("return getDb().transaction(async tx=>");
 const preflight=issue.indexOf("const eligible=await tx.select");
 const persist=issue.indexOf("await tx.insert(selectedShares)");
 const handout=issue.indexOf("return {shareId:row.id,token,accessCode:");
 assert.ok(transaction>=0&&preflight>transaction&&persist>preflight&&handout>persist);
});

test("scope rows are saved with the capability and later applicants cannot become visible",()=>{
 assert.match(issue,/selectedIds\.map\(applicationId=>\(\{\s*shareId:row\.id,applicationId/);
 assert.match(issue,/selectionMode:requestedIds\?"EXACT_SELECTION":"CURRENT_SHORTLIST_SNAPSHOT"/);
 assert.match(issue,/selectedCount:selectedIds\.length/);
 assert.match(publicView,/selectedIds\.length\?inArray\(placementApplications\.id,selectedIds\):sql.false/s);
 assert.match(publicView,/eq\(placementApplications\.status,"SUBMITTED"\)/);
 assert.match(publicView,/eq\(placementApplicationScreenings\.status,"SHORTLISTED"\)/);
 assert.match(publicView,/eq\(collegeMemberships\.status,"ACTIVE"\)/);
});
