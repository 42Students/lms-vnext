import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const leads=read("src/app/api/placements/tpo/leads/[leadId]/invite/route.ts");
const drives=read("src/app/api/placements/tpo/jobs/[jobId]/recruiter-review-invite/route.ts");
const issuer=read("src/modules/placements/tpo-recruiter-invite-service.ts");

test("TPO invitation endpoint admits verified queue even without the legacy direct mail flag",()=>{
  assert.match(leads,/!outboundQueueRuntimeEnabled\(\)/);
  assert.match(leads,/featureReady\("tpoRecruiterInviteEmail"\)/);
  assert.match(leads,/status:202/);
  assert.match(leads,/emailed:false,queued:true/);
  assert.match(leads,/if\(!invite\.emailed\)/);
});
test("drive-review invite actually requests queuing and differentiates pending delivery",()=>{
  assert.match(drives,/const outboxReady=outboundQueueRuntimeEnabled\(\)/);
  assert.match(drives,/sendEmail:body\.sendEmail&&\(outboxReady\|\|mailReady\)/);
  assert.match(drives,/emailQueued:invite\.queued/);
  assert.match(drives,/emailDeliveryAvailable:mailReady\|\|outboxReady/);
});
test("transactional producer never asserts queued means sent",()=>{
  assert.match(issuer,/queueOutboundDeliveryInTransaction\(tx,context/);
  assert.match(issuer,/emailed: false/);
  assert.match(issuer,/queued: queueStatus==="QUEUED"/);
  assert.match(issuer,/if \(!delivery\?\.sendEmail \|\| issued\.queueHandled\) return issued/);
});
