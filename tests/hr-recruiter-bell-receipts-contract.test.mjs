import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const bell=readFileSync("src/modules/placements/hr-recruiter-bell-service.ts","utf8");
const messaging=readFileSync("src/modules/placements/tpo-messaging-service.ts","utf8");
const start=bell.indexOf("export async function markHrRecruiterBellRead");
assert.ok(start>=0,"Recruiter bell mutation missing");
const mutation=bell.slice(start);

test("recruiter bell updates notifications and TPO messages inside one transaction",()=>{
 assert.match(mutation,/return getDb\(\)\.transaction\(async tx=>\{/);
 assert.match(mutation,/tx\.update\(inAppNotifications\)/);
 assert.match(mutation,/tx\.update\(placementTpoMessages\)/);
 assert.doesNotMatch(mutation,/getDb\(\)\.update\(/);
 assert.match(mutation,/notificationsMarked:notifications\.length,messagesMarked:messages\.length/);
});

test("recruiter bell revalidates a persisted grant, tenant and job ownership before writes",()=>{
 assert.match(mutation,/hasActiveRecruiter\(ctx\)/);
 assert.match(mutation,/ctx\.recruiter\.userId!==ctx\.user\.id/);
 assert.match(mutation,/loadActiveRecruiterGrant\(tx,ctx\.user\.id,feed\.collegeId,true\)/);
 assert.match(mutation,/if\(!grant\)throw new AuthorizationError/);
 assert.match(mutation,/eq\(placementJobs\.collegeId,feed\.collegeId\)/);
 assert.match(mutation,/eq\(placementJobs\.companyRelationshipId,grant\.companyRelationshipId\)/);
 assert.match(mutation,/eq\(placementTpoMessageThreads\.collegeId,feed\.collegeId\)/);
 assert.match(mutation,/eq\(placementTpoMessageThreads\.recruiterUserId,ctx\.user\.id\)/);
 assert.match(messaging,/export async function loadActiveRecruiterGrant\(/);
 assert.match(messaging,/eq\(placementRecruiterCollegeGrants\.verificationStatus, "VERIFIED"\)/);
 assert.match(messaging,/gt\(placementRecruiterCollegeGrants\.validUntil, new Date\(\)\)/);
});

test("no-job recruiter can acknowledge private general TPO conversation",()=>{
 assert.match(mutation,/const candidateThreadIds=recentThreads\.map\(thread=>thread\.id\)/);
 assert.match(mutation,/const jobs=candidateJobIds\.length\?/);
 assert.match(mutation,/const threads=candidateThreadIds\.length\?/);
 assert.match(mutation,/threads\.filter\(thread=>!thread\.jobId\|\|allowedJobs\.has\(thread\.jobId\)\)/);
 assert.doesNotMatch(mutation,/if\(!ids\.length\|\|!colleges\.length\)return \{marked:0\}/);
});

test("only unread incoming message receipts are marked, never recruiter sends or event rows",()=>{
 assert.match(mutation,/eq\(placementTpoMessages\.senderType,"TPO"\)/);
 assert.match(mutation,/eq\(placementTpoMessages\.kind,"MESSAGE"\)/);
 assert.match(mutation,/isNull\(placementTpoMessages\.readAt\)/);
 assert.match(mutation,/lte\(placementTpoMessages\.createdAt,now\)/);
 assert.match(mutation,/gte\(placementTpoMessageThreads\.lastMessageAt,cutoff\)/);
 assert.match(mutation,/isNull\(inAppNotifications\.readAt\)/);
});
