import {describe,expect,it} from "vitest";
import {projectTpoRoundFacts} from "@/modules/placements/tpo-round-facts-model";
const base={id:"round",name:"Interview",sequence:1,status:"SCHEDULED",
 mode:"ON_CAMPUS",venue:"Hall A",meetingUrl:null,scheduledAt:"2026-10-16T04:30:00.000Z",
 resultsDueAt:"2026-10-17T04:30:00.000Z",
 platform:"Skill Test",testUrl:"https://example.test",durationMinutes:45,whatToBring:"Laptop",
 participants:[{result:{status:"STAGED"}},{result:{status:"APPLIED"}},{result:null}]};
describe("TPO-drive-workspace-35 factual round card",()=>{
 it("shows persisted mode, schedule and correct result state",()=>{
  const facts=projectTpoRoundFacts(base);
  expect(facts).toMatchObject({status:"Scheduled",mode:"On campus",place:"Hall A",students:3,results:"1 waiting to apply",duration:45,platform:"Skill Test",bring:"Laptop"});
  expect(facts.when).toContain("10:00");
  expect(facts.when).toContain("IST");
  expect(facts.due).toContain("IST");
 });
 it("does not invent a venue or a result count for absent values",()=>{
  const facts=projectTpoRoundFacts({...base,status:"PENDING",mode:"ON_CAMPUS",
   venue:null,scheduledAt:null,resultsDueAt:null,participants:[]});
  expect(facts).toMatchObject({status:"Not run yet",place:"Venue to be told",when:"Date to be decided",due:"Not set",results:"None yet",students:0});
 });
 it("shows meeting URL and only applied outcomes when there are no staged ones",()=>{
  const facts=projectTpoRoundFacts({...base,mode:"VIRTUAL",meetingUrl:"https://example.test/meet",
   participants:[{result:{status:"APPLIED"}},{result:null}]});
  expect(facts.place).toBe("https://example.test/meet");
  expect(facts.results).toBe("1 applied");
 });
});
