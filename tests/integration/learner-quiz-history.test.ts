import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
import {getMyQuizAttempts} from "@/modules/courses/quiz-attempt-service";
import {ownQuizHistorySelection,learnerAttemptResultLabel} from "@/modules/courses/learner-quiz-history-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerLearningFixture,seedLearnerLearningFixture,cleanupLearnerLearningFixture,type LearnerLearningFixture} from "../support/learner-learning-surface-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Learner quiz history needs disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerLearningFixture|null=null;
beforeEach(async()=>{
  fixture=newLearnerLearningFixture();await seedLearnerLearningFixture(pool,fixture);
},45000);
afterEach(async()=>{
  if(fixture){const owner=fixture;fixture=null;await cleanupLearnerLearningFixture(pool,owner);}
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own learner quiz attempts and results on PostgreSQL",()=>{
  it("shows a persisted attempt, masks unpublished scores, then reveals only published results",async()=>{
    const {learner,ids}=fixture!;
    await pool.query("INSERT INTO quiz_attempts(id,quiz_id,delivery_id,membership_id,attempt_number,score,max_score) VALUES($1,$2,$3,$4,1,6,10)",
      [ids.attempt,ids.quiz,ids.delivery,learner.ids.membership]);
    const overview=await getLearnerAssessmentOverview(learner.context);
    expect(ownQuizHistorySelection(overview.quizzes,{quizId:ids.quiz,deliveryId:ids.delivery})?.quiz).toMatchObject({
      id:ids.quiz,attemptsUsed:1,
    });
    const hidden=await getMyQuizAttempts(learner.context,ids.quiz,ids.delivery);
    expect(hidden).toHaveLength(1);
    expect(hidden[0]).toMatchObject({score:null,resultsVisible:false});
    expect(learnerAttemptResultLabel(hidden[0]!)).toBe("Result not published");
    // Published alone does not release grades before the scheduled due instant.
    await pool.query("UPDATE course_quizzes SET status='CLOSED',results_published=true,due_at='2026-10-01T00:00:00.000Z' WHERE id=$1",[ids.quiz]);
    const publicAttempts=await getMyQuizAttempts(learner.context,ids.quiz,ids.delivery);
    expect(publicAttempts[0]).toMatchObject({score:6,maxScore:10,resultsVisible:true});
  });
  it("rejects forged-college, suspended, wrong-role and forged actor requests",async()=>{
    const {learner,ids}=fixture!;
    const base=learner.context;
    const denied:RequestContext[]=[
      {...base,membership:{...base.membership!,collegeId:SEED_IDS.collegeB}},
      {...base,membership:{...base.membership!,status:"SUSPENDED"}},
      {...base,membership:{...base.membership!,roles:["FACULTY"]}},
      {...base,user:{...base.user,id:SEED_IDS.facultyUser}},
    ];
    for(const context of denied) {
      await expect(getMyQuizAttempts(context,ids.quiz,ids.delivery)).rejects.toBeDefined();
    }
  });
});