import {expect,it} from "vitest";
import {classTeamCapacity} from "@/modules/projects/class-team-capacity";
it("fails closed on repeated learner identities across team groups",()=>{
 expect(()=>classTeamCapacity([{name:"A",membershipIds:["a"]},{name:"B",membershipIds:["a"]}])).toThrow("Invalid team roster");
});
it("rejects more than the supported 2,000 learners",()=>{
 expect(()=>classTeamCapacity([{name:"One",membershipIds:Array.from({length:2001},(_,i)=>String(i))}])).toThrow("Invalid team roster");
});
it("still reports balanced groups without changing the source",()=>{
 const groups=[{name:"A",membershipIds:["a","b"]},{name:"B",membershipIds:["c"]}];
 expect(classTeamCapacity(groups)).toEqual({teams:2,students:3,minimum:1,maximum:2,balanced:true});
 expect(groups[0].membershipIds).toEqual(["a","b"]);
});
