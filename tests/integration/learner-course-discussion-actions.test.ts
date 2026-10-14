import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, afterAll, describe, it, expect } from "vitest";
import { Pool } from "pg";
import type { RequestContext } from "@/modules/identity/context";
import { closeDatabaseConnection } from "@/db/client";
import { createCourseDiscussionMessage, listCourseDiscussionMessages, deleteCourseDiscussionMessage, toggleCourseDiscussionPin } from "@/modules/courses/discussion-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";
if (!process.env.TEST_DATABASE_URL) throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const learner:RequestContext={user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]}};
const ids={section:randomUUID(),sectionEnrollment:randomUUID(),course:randomUUID(),offering:randomUUID(),delivery:randomUUID()};
let prepared=false;
beforeEach(async()=>{
  await enableSeedLearnerPlacementAccess(pool);
  const parent=await pool.query<{id:string;cohort_id:string;start_period_id:string}>([
    "SELECT e.id,e.cohort_id,c.start_period_id FROM learner_program_enrollments e",
    "JOIN cohorts c ON c.id=e.cohort_id",
    "WHERE e.membership_id=$1 AND e.status='ACTIVE' LIMIT 2",
  ].join(" "),[SEED_IDS.learnerCollegeAMembership]);
  if(parent.rows.length!==1)throw new Error("Expected one active learner academic parent");
  const enrollment=parent.rows[0]!;prepared=true;
  const suffix=ids.course.slice(0,8);
  await pool.query("INSERT INTO sections(id,cohort_id,academic_period_id,name,code) VALUES($1,$2,$3,$4,$5)",
    [ids.section,enrollment.cohort_id,enrollment.start_period_id,"Discussion Section "+suffix,"L5-DIS-"+suffix]);
  await pool.query("INSERT INTO section_enrollments(id,learner_enrollment_id,section_id,academic_period_id) VALUES($1,$2,$3,$4)",
    [ids.sectionEnrollment,enrollment.id,ids.section,enrollment.start_period_id]);
  await pool.query("INSERT INTO courses(id,department_id,name,code) VALUES($1,$2,$3,$4)",[ids.course,SEED_IDS.departmentA,"Discussion "+suffix,"L5DISC-"+suffix]);
  await pool.query("INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id) VALUES($1,$2,$3,$4)",[ids.offering,ids.course,enrollment.cohort_id,enrollment.start_period_id]);
  await pool.query("INSERT INTO course_section_deliveries(id,offering_id,section_id) VALUES($1,$2,$3)",[ids.delivery,ids.offering,ids.section]);
},45000);
afterEach(async()=>{if(!prepared)return;
  // Delete only operational messages/own hierarchy; immutable activity_events remain.
  await pool.query("DELETE FROM course_discussion_messages WHERE delivery_id=$1",[ids.delivery]);
  await pool.query("DELETE FROM course_section_deliveries WHERE id=$1",[ids.delivery]);
  await pool.query("DELETE FROM section_enrollments WHERE id=$1",[ids.sectionEnrollment]);
  await pool.query("DELETE FROM sections WHERE id=$1",[ids.section]);
  await pool.query("DELETE FROM course_offerings WHERE id=$1",[ids.offering]);
  await pool.query("DELETE FROM courses WHERE id=$1",[ids.course]);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner discussion post/reply/delete, PostgreSQL",()=>{
  it("posts, Section-validates reply, blocks learner moderation, deletes only owned unpinned messages",async()=>{
    const first=await createCourseDiscussionMessage(learner,ids.delivery,{messageText:"First class question"});
    const reply=await createCourseDiscussionMessage(learner,ids.delivery,{messageText:"Follow up",replyToMessageId:first.id});
    expect(reply.messageText).toContain(first.id.slice(0,8));
    const feed=await listCourseDiscussionMessages(learner,ids.delivery);
    expect(feed.messages.map(m=>m.id)).toEqual(expect.arrayContaining([first.id,reply.id]));
    await expect(toggleCourseDiscussionPin(learner,first.id,ids.delivery)).rejects.toBeDefined();
    await expect(createCourseDiscussionMessage(learner,ids.delivery,
      {messageText:"Wrong parent",replyToMessageId:randomUUID()})).rejects.toBeDefined();
    const deleted=await deleteCourseDiscussionMessage(learner,reply.id,ids.delivery);
    expect(deleted.id).toBe(reply.id);
    const after=await listCourseDiscussionMessages(learner,ids.delivery);
    expect(after.messages.some(message=>message.id===reply.id)).toBe(false);
    const events=await pool.query<{count:string}>("SELECT count(*)::text AS count FROM activity_events WHERE subject_id=$1 AND event_type='courses.discussion.posted'",[first.id]);
    expect(events.rows[0]?.count).toBe("1");
  },30000);
  it("denies forged-college, suspended, wrong-role, forged identity, and foreign message deletion",async()=>{
    const first=await createCourseDiscussionMessage(learner,ids.delivery,{messageText:"Owned learner message"});
    const bad:RequestContext[]=[
      {...learner,membership:{...learner.membership!,collegeId:SEED_IDS.collegeB}},
      {...learner,membership:{...learner.membership!,status:"SUSPENDED"}},
      {...learner,membership:{...learner.membership!,roles:["FACULTY"]}},
      {...learner,user:{...learner.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of bad){
      await expect(createCourseDiscussionMessage(actor,ids.delivery,{messageText:"Spoofed"})).rejects.toBeDefined();
      await expect(deleteCourseDiscussionMessage(actor,first.id,ids.delivery)).rejects.toBeDefined();
    }
    const stored=await pool.query("SELECT id FROM course_discussion_messages WHERE id=$1",[first.id]);
    expect(stored.rows).toHaveLength(1);
  });
});