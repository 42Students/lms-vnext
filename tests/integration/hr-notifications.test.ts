import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {eq,and} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "@/db/client";
import {users,activityEvents,inAppNotifications} from "@/db/schema";
import {createPlacementCompany} from "@/modules/placements/company-service";
import {createPlacementJob,publishPlacementJob} from "@/modules/placements/job-service";
import {grantPlacementRecruiter} from "@/modules/placements/recruiter-service";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
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
  const n=randomUUID().slice(0,8),email="notif-"+n+"@example.test";
  const [person]=await getDb().insert(users).values({identityUid:"notif-"+n,email,displayName:"Recruiter"}).returning();
  const a=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Notif Own "+n,primaryDomain:"notifown-"+n+".example"});
  const b=await createPlacementCompany(tpo,{collegeId:SEED_IDS.collegeA,name:"Notif Other "+n,primaryDomain:"notifother-"+n+".example"});
  const grant=await grantPlacementRecruiter(tpo,{companyRelationshipId:a.relationship.id,email,title:"HR"});
  const job=await createPlacementJob(tpo,{collegeId:SEED_IDS.collegeA,companyRelationshipId:a.relationship.id,
   title:"Notif Job "+n,description:"Fixture",employmentType:"FULL_TIME",workMode:"HYBRID",applicationMode:"INTERNAL"});
  await publishPlacementJob(tpo,job.id);
  const [event]=await getDb().select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.subjectId,job.id),eq(activityEvents.eventType,"placements.job.published"))).limit(1);
  expect(event).toBeDefined();
  await getDb().insert(inAppNotifications).values({userId:person.id,eventId:event!.id,
   title:"A recruiter-only note",body:"Confidential source body"});
  const ctx:RequestContext={user:{id:person.id,identityUid:person.identityUid,platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,recruiter:{userId:person.id,companyId:a.company.id,companyName:"Fixture",status:"ACTIVE",
    title:null,grants:[{id:grant.grant.id,collegeId:SEED_IDS.collegeA,
     organizationId:SEED_IDS.organization,collegeName:"Fixture",companyRelationshipId:a.relationship.id}]}};
  const result=await listHrNotifications(ctx,{collegeId:SEED_IDS.collegeA});
  expect(result.rows.some(row=>row.jobId===job.id)).toBe(true);
  expect(JSON.stringify(result.rows)).not.toContain("Confidential source body");
  await expect(listHrNotifications({...ctx,recruiter:{...ctx.recruiter!,companyId:b.company.id}},
    {collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  await expect(listHrNotifications(tpo,{})).rejects.toBeDefined();
 });
});
