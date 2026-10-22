import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync("src/modules/placements/offer-service.ts","utf8");
const helper=source.split("async function notifyCollegeTpoOfOfferResponse(")[1]?.split("/** A response may invalidate")[0]??"";
describe("offer response TPO notification parity",()=>{
 it("keeps TPO recipients scoped to active college membership and platform account",()=>{
  expect(helper).toContain('eq(membershipRoles.role,"TPO")');
  expect(helper).toContain('eq(collegeMemberships.collegeId,collegeId)');
  expect(helper).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(helper).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(helper).toContain("new Set(officers.map(row=>row.userId))");
  expect(helper).toContain("if(!recipients.length)return");
 });
 it("sends via the audited event to an existing TPO offer register",()=>{
  expect(helper).toContain("deliverInAppNotificationInTransaction(tx,eventId,recipients");
  expect(helper).toContain('actionHref:"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/offers"');
  expect(helper).toContain("Placement offer accepted");
  expect(helper).toContain("Placement offer declined");
 });
 it("keeps learner notices and notifies TPO on both ACCEPT and DECLINE",()=>{
  for(const [eventId,response] of [
   ["acceptedNoticeEvent.id",'"ACCEPTED"'],
   ["declinedNoticeEvent.id",'"DECLINED"'],
  ] as const) expect(source).toContain(
   "current.job.id,current.job.title,"+eventId+","+response);
  expect(source).toContain('kind:"APPLICATION_STATUS_CHANGED",subject:"Offer accepted for "+current.job.title');
  expect(source).toContain('kind:"APPLICATION_STATUS_CHANGED",subject:"Offer declined for "+current.job.title');
 });
});
