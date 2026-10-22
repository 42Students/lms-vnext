import { publishableJobTerms } from "../support/publishable-job-terms";
import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {eq,and} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob} from "@/modules/placements/job-service";
import {publishPreparedPlacementJob} from "../support/publishable-job-fixture";
import {createPersistedJobRecruiter,persistedRecruiterContext} from "../support/persisted-job-recruiter-fixture";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
import {hrTodayUnreadAction} from "@/modules/placements/hr-today-unread-model";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const tpo:RequestContext={user:{id:SEED_IDS.facultyUser,identityUid:"hr-notif-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]}};
describe.skipIf(!enabled)("HR in-app notification scopes",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("reads only own recipient's exact company job notification",async()=>{
  const n=randomUUID().slice(0,8),identityUid="notif-"+n;
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Notif Own "+n,primaryDomain:"notifown-"+n+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Notif Other "+n,primaryDomain:"notifother-"+n+".example"});

  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
   title:"Notif Job "+n,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL",...publishableJobTerms});
  await publishPreparedPlacementJob(tpo,job.id);
  // Create an ACTIVE persisted recruiter profile and VERIFIED, unexpired DRIVES
  // grant, then link ONLY this TPO-authored drive through the approved-request
  // ownership fixture. A synthetic context alone must not authorize any job.
  const recruiter=await createPersistedJobRecruiter({
   companyId:a.company.id,companyRelationshipId:a.relationship.id,
   collegeId:SEED_IDS.collegeA,jobId:job.id,
   grantedByUserId:tpo.user.id,identityUid,
  });
  const ctx=persistedRecruiterContext({
   userId:recruiter.userId,identityUid,companyId:a.company.id,
   grantId:recruiter.grantId,collegeId:SEED_IDS.collegeA,
   organizationId:SEED_IDS.organization,companyRelationshipId:a.relationship.id,
  });
  const owned=await listOwnRecruiterPlacementJobs(ctx,SEED_IDS.collegeA);
  expect(owned.some(row=>row.job.id===job.id)).toBe(true);
  expect(owned.some(row=>row.companyId===b.company.id)).toBe(false);
  const [event]=await getDb().select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.subjectId,job.id),eq(activityEvents.eventType,"placements.job.published"))).limit(1);
  expect(event).toBeDefined();
  await getDb().insert(inAppNotifications).values({userId:recruiter.userId,eventId:event!.id,
   title:"A recruiter-only note",body:"Confidential source body"});

  const result=await listHrNotifications(ctx,{collegeId:SEED_IDS.collegeA});
  expect(result.rows.some(row=>row.jobId===job.id)).toBe(true);
  const staleTab=await listHrNotifications(ctx,{collegeId:SEED_IDS.collegeA,page:9999});
  expect(staleTab.page).toBe(1);
  expect(staleTab.rows.some(row=>row.jobId===job.id)).toBe(true);
  expect(staleTab.last).toBeGreaterThan(0);
  const matched=await listHrNotifications(ctx,{collegeId:SEED_IDS.collegeA,q:"Notif Job "+n});
  expect(matched.rows.some(row=>row.jobId===job.id)).toBe(true);
  const missing=await listHrNotifications(ctx,{collegeId:SEED_IDS.collegeA,q:"Not a matching job"});
  expect(missing.total).toBe(0);
  const scoped=await listHrNotifications(ctx,{collegeId:SEED_IDS.collegeA,unreadOnly:"true"});
  expect(hrTodayUnreadAction({...scoped,collegeId:SEED_IDS.collegeA})?.value).toBe(1);
  expect(JSON.stringify(result.rows)).not.toContain("Confidential source body");
  // An existing grant cannot be repurposed to browse another employer in
  // the SAME college, even when the cached recruiter company is tampered with.
  const foreignEmployer={...ctx,recruiter:{...ctx.recruiter!,companyId:b.company.id}};
  const foreignInbox=await listHrNotifications(foreignEmployer,{collegeId:SEED_IDS.collegeA});
  expect(foreignInbox.rows).toEqual([]);
  expect(foreignInbox.total).toBe(0);
  await expect(listHrNotifications(foreignEmployer,
    {collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  await expect(listHrNotifications(tpo,{})).rejects.toBeDefined();
 });
});
