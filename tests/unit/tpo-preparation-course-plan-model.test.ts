import {it,expect} from "vitest";
import {buildTpoPreparationCoursePlan} from "@/modules/placements/tpo-preparation-course-plan-model";
const input={ready:true,courseIds:["a","b"],minimumCompleted:1,catalog:[{id:"a",name:"Communication",code:"COMM"}]};
it("separates configured-but-not-in-bounded-catalog courses from zero",()=>{
 const plan=buildTpoPreparationCoursePlan(input);
 expect(plan.courses).toHaveLength(1);
 expect(plan.unresolved).toBe(1);
 expect(plan.minimumCompleted).toBe(1);
});
it("does not invent a plan when migration is unavailable",()=>{
 expect(buildTpoPreparationCoursePlan({...input,ready:false})).toEqual({ready:false,courses:[],unresolved:0,minimumCompleted:0});
});
