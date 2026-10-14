import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { submitCourseAssignment } from "@/modules/courses/assignment-submission-service";
import { findOwnLearnerAssignment } from "@/modules/courses/learner-assignment-detail-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerLearningFixture, seedLearnerLearningFixture, cleanupLearnerLearningFixture,
  type LearnerLearningFixture,
} from "../support/learner-learning-surface-fixture";

if (!process.env.TEST_DATABASE_URL) throw new Error("Learner assignment tests need disposable TEST_DATABASE_URL");
const pool = new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture: LearnerLearningFixture | null = null;
beforeEach(async()=>{
  fixture=newLearnerLearningFixture();
  await seedLearnerLearningFixture(pool,fixture);
},45000);
afterEach(async()=>{
  if(fixture) {
    const owned=fixture;fixture=null;
    await cleanupLearnerLearningFixture(pool,owned);
  }
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);

describe("assignment detail and audited learner submission on PostgreSQL",()=>{
  it("lists own persisted assignment and writes text with atomic private audit",async()=>{
    const {learner,ids}=fixture!;
    const overview=await getLearnerAssessmentOverview(learner.context);
    expect(findOwnLearnerAssignment(overview.assignments,{
      assignmentId:ids.assignment,deliveryId:ids.delivery,
    })).toMatchObject({id:ids.assignment,submissionId:null});
    const saved=await submitCourseAssignment(learner.context,ids.assignment,{
      deliveryId:ids.delivery,submissionType:"TEXT",textContent:"My private explanation",
    });
    expect(saved).toMatchObject({
      assignmentId:ids.assignment, membershipId:learner.ids.membership,
      submissionType:"TEXT",gradePublished:false,
    });
    const refreshed=await getLearnerAssessmentOverview(learner.context);
    expect(findOwnLearnerAssignment(refreshed.assignments,{
      assignmentId:ids.assignment,deliveryId:ids.delivery,
    })).toMatchObject({submissionText:"My private explanation",feedback:null,pointsAwarded:null});
    const audit=await pool.query<{actor_user_id:string;metadata:Record<string,unknown>}>(
      "SELECT actor_user_id,metadata FROM activity_events WHERE event_type='courses.assignment.submitted' AND subject_id=$1 AND actor_user_id=$2",
      [ids.assignment,learner.ids.user]);
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]?.actor_user_id).toBe(learner.ids.user);
    expect(JSON.stringify(audit.rows[0]?.metadata)).not.toContain("My private explanation");
  });
  it("denies forged-college, suspended, wrong-role and forged actor without audit",async()=>{
    const {learner,ids}=fixture!;
    const base=learner.context;
    const denied:RequestContext[]=[
      {...base,membership:{...base.membership!,collegeId:SEED_IDS.collegeB}},
      {...base,membership:{...base.membership!,status:"SUSPENDED"}},
      {...base,membership:{...base.membership!,roles:["FACULTY"]}},
      {...base,user:{...base.user,id:SEED_IDS.facultyUser}},
    ];
    for(const context of denied) {
      await expect(getLearnerAssessmentOverview(context)).rejects.toBeDefined();
      await expect(submitCourseAssignment(context,ids.assignment,{
        deliveryId:ids.delivery,submissionType:"LINK",submissionUrl:"https://example.org/answer",
      })).rejects.toBeDefined();
    }
    const submissions=await pool.query("SELECT id FROM assignment_submissions WHERE assignment_id=$1",[ids.assignment]);
    expect(submissions.rows).toHaveLength(0);
    const audits=await pool.query("SELECT id FROM activity_events WHERE event_type='courses.assignment.submitted' AND subject_id=$1",[ids.assignment]);
    expect(audits.rows).toHaveLength(0);
  });
});