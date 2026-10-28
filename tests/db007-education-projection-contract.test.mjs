import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = path => readFileSync(new URL(path,import.meta.url),"utf8");
const projection=read("../src/modules/people/learner-education-projection-service.ts");
const section=read("../src/modules/people/learner-profile-section-service.ts");
const full=read("../src/modules/people/learner-profile-document-edit-service.ts");
test("DB-007 both learner edit writers use one transactionally derived education projection",()=>{
 assert.match(section,/await syncLearnerEducationProjection\(tx, membership\.id, input\.items\)/);
 assert.match(full,/await syncLearnerEducationProjection\(tx, member\.id, nextDocument\.education\)/);
 for(const src of [section,full])assert.ok(src.indexOf("await syncLearnerEducationProjection(")<src.lastIndexOf("tx.update(learnerProfiles)"));
});
test("DB-007 projection fails cross-owner, false CLEAN and partial-draft promotion closed",()=>{
 assert.match(projection,/setWhere: eq\(learnerProfileEducationEntries\.learnerMembershipId, membershipId\)/);
 assert.match(projection,/throw new Error\("EDUCATION_OWNERSHIP_CONFLICT"\)/);
 assert.match(projection,/eq\(profilePrivateDocumentReceipts\.scanStatus, "CLEAN"\)/);
 assert.match(projection,/throw new Error\("EDUCATION_RECEIPT_INVALID"\)/);
 assert.match(projection,/item\.gradeObtained\.trim\(\) && item\.maxGrade\.trim\(\)/);
 assert.match(projection,/archivedAt: new Date\(\)/);
});
