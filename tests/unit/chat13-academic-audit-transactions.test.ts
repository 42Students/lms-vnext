import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");
const areas=[
 {source:"src/modules/academics/period-service.ts",verbs:["ACADEMICS_PERIOD_CREATED","ACADEMICS_PERIOD_UPDATED","ACADEMICS_PERIOD_ACTIVATED"]},
 {source:"src/modules/academics/cohort-service.ts",verbs:["ACADEMICS_COHORT_CREATED","ACADEMICS_COHORT_UPDATED","ACADEMICS_COHORT_STATUS_CHANGED"]},
 {source:"src/modules/academics/section-service.ts",verbs:["ACADEMICS_SECTION_CREATED","ACADEMICS_SECTION_UPDATED","ACADEMICS_SECTION_ARCHIVED"]},
];
describe("SA-academics-people-R04 persisted academic audit",()=>{
 it("SA-academics-people-R04 audits all nine academic mutations transactionally",()=>{
  const taxonomy=read("src/modules/activity/taxonomy.ts");
  for(const area of areas){
   const service=read(area.source);
   expect((service.match(/db.transaction\(async \(tx\)/g)||[]).length).toBeGreaterThanOrEqual(3);
   for(const event of area.verbs){
    expect(taxonomy).toContain(event);
    expect(service).toContain("eventType:ACTIVITY_EVENT_TYPES."+event);
   }
   expect((service.match(/recordActivityEventInTransaction\(tx,context/g)||[]).length).toBe(3);
  }
 });
});
