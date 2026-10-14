import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getLearnerClassSchedule} from "@/modules/academics/learner-schedule-service";
import {resolveOwnLearnerCalendarFilters} from "@/modules/academics/learner-calendar-filter-model";
import {filterScheduleEvents} from "@/components/academics/learner-schedule-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerLearningFixture,seedLearnerLearningFixture,cleanupLearnerLearningFixture,type LearnerLearningFixture} from "../support/learner-learning-surface-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Learner schedule tests require disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerLearningFixture|null=null;
beforeEach(async()=>{
  fixture=newLearnerLearningFixture(); await seedLearnerLearningFixture(pool,fixture);
},45000);
afterEach(async()=>{
  if(fixture){const owner=fixture;fixture=null;await cleanupLearnerLearningFixture(pool,owner);}
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("own learner schedule sourced from PostgreSQL sessions",()=>{
  it("reads exactly the own persisted class and filters month/week and delivery",async()=>{
    const {learner,ids}=fixture!;
    const schedule=await getLearnerClassSchedule(learner.context);
    expect(schedule.events).toEqual(expect.arrayContaining([
      expect.objectContaining({id:ids.event,deliveryId:ids.delivery,title:expect.stringContaining("Learning class")}),
    ]));
    const filters=resolveOwnLearnerCalendarFilters({
      view:"month",month:"2026-10",deliveryId:ids.delivery,
    },schedule.courses,new Date(2026,9,14));
    expect(filters?.view).toBe("month");
    expect(filterScheduleEvents(schedule.events.map(event=>({...event,startsAt:event.startsAt.toISOString(),endsAt:event.endsAt.toISOString()})),filters!.selectedDeliveryIds)
      .some(event=>event.id===ids.event)).toBe(true);
    expect(resolveOwnLearnerCalendarFilters({
      deliveryId:SEED_IDS.collegeB,
    },schedule.courses,new Date())).toBeNull();
  });
  it("denies foreign college, suspended, wrong-role and forged actor identities",async()=>{
    const base=fixture!.learner.context;
    const cases:RequestContext[]=[
      {...base,membership:{...base.membership!,collegeId:SEED_IDS.collegeB}},
      {...base,membership:{...base.membership!,status:"SUSPENDED"}},
      {...base,membership:{...base.membership!,roles:["FACULTY"]}},
      {...base,user:{...base.user,id:SEED_IDS.facultyUser}},
    ];
    for(const invalid of cases) {
      await expect(getLearnerClassSchedule(invalid)).rejects.toBeDefined();
    }
  });
});