import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const bell=readFileSync("src/modules/placements/hr-recruiter-bell-service.ts","utf8");
const inbox=readFileSync("src/modules/placements/hr-notifications-service.ts","utf8");
const helper=readFileSync("src/modules/placements/hr-recruiter-read-watermark-service.ts","utf8");
const mark=bell.slice(bell.indexOf("export async function markHrRecruiterBellRead("));
const count=bell.slice(bell.indexOf("export async function countHrRecruiterBellUnread("),
 bell.indexOf("function hrBellTab("));

test("first recruiter feed visit has bounded seven-day lookback, thereafter persisted marker",()=>{
 assert.match(helper,/firstVisit:!marker/);
 assert.match(helper,/marker\?\.readThrough\?\?new Date\(now\.getTime\(\)-7\*86400000\)/);
 assert.match(helper,/eq\(placementRecruiterNotificationReads\.recruiterUserId,recruiterUserId\)/);
 assert.match(helper,/eq\(placementRecruiterNotificationReads\.collegeId,collegeId\)/);
 assert.match(count,/getRecruiterNotificationReadThreshold\(ctx\.user\.id,collegeId\)/);
 assert.match(count,/firstVisit:threshold\.firstVisit/);
 assert.doesNotMatch(count,/readReceipts/);
});

test("bell and full inbox use same strict watermark on actual notification receipt time",()=>{
 assert.match(count,/inAppNotifications\.createdAt\} > \$\{threshold\.unreadSince\}/);
 assert.match(inbox,/getRecruiterNotificationReadThreshold\(context\.user\.id,collegeId\)/);
 assert.match(inbox,/inAppNotifications\.createdAt\} > \$\{threshold\.unreadSince\}/);
 assert.match(inbox,/gt\(inAppNotifications\.createdAt,threshold\.unreadSince\)/);
 assert.match(inbox,/notificationCreatedAt:inAppNotifications\.createdAt/);
 assert.match(inbox,/row\.notificationCreatedAt<=threshold\.unreadSince/);
 assert.match(bell,/unread:item\.unread,/);
});

test("mark all writes monotonic DB-clock watermark atomically with both read-receipt stores",()=>{
 assert.match(mark,/return getDb\(\)\.transaction\(async tx=>\{/);
 assert.match(mark,/loadActiveRecruiterGrant\(tx,ctx\.user\.id,feed\.collegeId,true\)/);
 assert.match(mark,/tx\.update\(inAppNotifications\)/);
 assert.match(mark,/tx\.update\(placementTpoMessages\)/);
 assert.match(mark,/tx\.insert\(placementRecruiterNotificationReads\)/);
 assert.match(mark,/readThrough:sql.statement_timestamp\(\)/s);
 assert.match(mark,/onConflictDoUpdate\(\{/);
 assert.match(mark,/greatest\(\$\{placementRecruiterNotificationReads\.readThrough\}, statement_timestamp\(\)\)/);
 assert.doesNotMatch(mark,/getDb\(\)\.insert\(placementRecruiterNotificationReads\)/);
});

test("mark all persists a marker even without any job or unread TPO thread",()=>{
 assert.match(mark,/const jobs=candidateJobIds\.length\?/);
 assert.match(mark,/const threads=candidateThreadIds\.length\?/);
 const marker=mark.indexOf("await tx.insert(placementRecruiterNotificationReads)");
 const end=mark.indexOf("return {marked:notifications.length+messages.length");
 assert.ok(marker>0&&end>marker);
 assert.doesNotMatch(mark,/if\(!candidateJobIds\.length\)return/);
});

test("the watermark cannot be altered via an unrelated recruiter or college identity",()=>{
 assert.match(mark,/eq\(placementJobs\.companyRelationshipId,grant\.companyRelationshipId\)/);
 assert.match(mark,/eq\(placementTpoMessageThreads\.collegeId,feed\.collegeId\)/);
 assert.match(mark,/eq\(placementTpoMessageThreads\.recruiterUserId,ctx\.user\.id\)/);
 assert.match(mark,/recruiterUserId:ctx\.user\.id,collegeId:feed\.collegeId/);
});
