import { randomUUID } from "node:crypto";
import { describe,expect,it } from "vitest";
import { validateLearnerProfileSectionEdit } from "@/modules/people/learner-profile-section-model";
describe("learner profile section-only mutations",()=>{
  it("accepts bounded education/skills/projects and preserves type",()=>{
    const id=randomUUID();
    const result=validateLearnerProfileSectionEdit({confirmed:true,section:"skills",items:[{id,name:"TypeScript"}]});
    expect(result.section).toBe("skills");
    expect(result.items).toEqual([{id,name:"TypeScript",proficiency:""}]);
  });
  it("rejects identity injection, oversized arrays and unconfirmed writes",()=>{
    for(const input of [
      {confirmed:false,section:"skills",items:[]},
      {confirmed:true,section:"identity",items:[]},
      {confirmed:true,section:"skills",items:[],collegeId:randomUUID()},
      {confirmed:true,section:"skills",items:Array.from({length:101},(_,i)=>({id:randomUUID(),name:"Skill"+i}))},
      {confirmed:true,section:"projects",items:[{id:randomUUID(),name:"Demo",githubUrl:"javascript:bad"}]},
    ]) expect(()=>validateLearnerProfileSectionEdit(input)).toThrow();
  });
});
