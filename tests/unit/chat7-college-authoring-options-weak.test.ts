import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 options:vi.fn(),select:vi.fn(),rows:[] as Array<{lessonId:string;highest:number|null}>,
}));
vi.mock("@/modules/courses/college-content-authoring-service",()=>({
 getCollegeContentAuthoringOptions:state.options,
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {getCollegeAssignmentAuthoringOptions} from "@/modules/courses/college-assignment-authoring-options";
import {getCollegeQuizAuthoringOptions} from "@/modules/courses/college-quiz-authoring-options";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const foreign="33333333-3333-4333-8333-333333333333";
const context={} as Parameters<typeof getCollegeAssignmentAuthoringOptions>[0];
beforeEach(()=>{
 state.options.mockReset();state.select.mockReset();
 state.rows=[];
 state.options.mockResolvedValue({lessons:[{id:a,name:"First"},{id:b,name:"Second"}]});
 state.select.mockImplementation(()=>({
  from(){return this;},where(){return this;},
  groupBy(){return Promise.resolve(state.rows);},
 }));
});
describe("COURSES-WEAK-AUTHORING-OPTIONS-01 scoped assignment/quiz next sequence",()=>{
 for(const [kind,runner] of [["assignment",getCollegeAssignmentAuthoringOptions],["quiz",getCollegeQuizAuthoringOptions]] as const){
  it(`${kind} lists only authoring-service authorized lesson rows with persisted next sequence`,async()=>{
   state.rows=[{lessonId:a,highest:9},{lessonId:b,highest:0},
    {lessonId:foreign,highest:999}];
   const rows=await runner(context);
   expect(rows).toEqual([{id:a,name:"First",nextSequence:10},
    {id:b,name:"Second",nextSequence:1}]);
   expect(rows.map(x=>x.id)).not.toContain(foreign);
   expect(state.options).toHaveBeenCalledWith(context,"RESOURCE");
   expect(state.select).toHaveBeenCalledTimes(1);
  });
  it(`${kind} returns no choices/no DB query when acting college has no authorized lessons`,async()=>{
   state.options.mockResolvedValueOnce({lessons:[]});
   expect(await runner(context)).toEqual([]);
   expect(state.select).not.toHaveBeenCalled();
  });
  it(`${kind} treats absent or null max sequence as 0 without guessing prior authoring`,async()=>{
   state.rows=[{lessonId:a,highest:null}];
   const result=await runner(context);
   expect(result.map(x=>x.nextSequence)).toEqual([0,0]);
  });
 }
});
