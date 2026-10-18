import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {getProjectEvaluation,listProjectEvaluations} from "@/modules/projects/evaluation-service";

const projectId="11111111-1111-4111-8111-111111111111";
const submissionId="22222222-2222-4222-8222-222222222222";
const evaluationId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  access:"ADMIN" as "ADMIN"|"MENTOR"|"LEARNER",
  denied:false,hasEvaluation:true,reads:0,conditions:[] as unknown[],
}));
vi.mock("@/modules/projects/access",()=>({
  requireProjectReadAccess:async(_ctx:unknown,id:string)=>{
    if(state.denied||id!==projectId)throw new Error("PROJECT_ACCESS_DENIED");
    return {access:state.access,project:{id:projectId}};
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    select:()=>{
      const position=state.reads++;
      const rows=position===0
        ?state.hasEvaluation?[{id:evaluationId,projectId,submissionId,score:9}]:[]
        :[{evaluationId,criterion:"Build",score:9,maxScore:10,sequence:0}];
      const q={
        from:()=>q,
        where:(condition:unknown)=>{state.conditions.push(condition);return q;},
        orderBy:()=>q,
        limit:async()=>rows,
        then:(fn:(values:typeof rows)=>unknown)=>Promise.resolve(rows).then(fn),
      };
      return q;
    },
  }),
}));
const actor:RequestContext={
  user:{id:"44444444-4444-4444-8444-444444444444",
    identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{collegeId:"55555555-5555-4555-8555-555555555555"},
};
const render=(sql:unknown)=>new PgDialect().sqlToQuery(sql as SQL);
beforeEach(()=>{state.access="ADMIN";state.denied=false;state.hasEvaluation=true;state.reads=0;state.conditions=[];});
describe("IIT Dharwad rubric evaluation read privacy and project tenancy",()=>{
  it("PROJ-BREAK-grading-02 College Admin can read only this project's single submission evaluation and item sequence",async()=>{
    const result=await getProjectEvaluation(actor,projectId,submissionId);
    expect(result?.evaluation.id).toBe(evaluationId);
    expect(result?.items).toHaveLength(1);
    expect(state.reads).toBe(2);
    const where=render(state.conditions[0]);
    expect(where.params).toContain(projectId);
    expect(where.params).toContain(submissionId);
    const itemWhere=render(state.conditions[1]);
    expect(itemWhere.params).toContain(evaluationId);
  });
  it("PROJ-BREAK-grading-03 mentor can list project-scoped evaluations; no cross-project item exposure",async()=>{
    state.access="MENTOR";
    const result=await listProjectEvaluations(actor,projectId);
    expect(result.evaluations).toHaveLength(1);
    expect(result.items).toHaveLength(1);
    expect(render(state.conditions[0]).params).toContain(projectId);
    expect(render(state.conditions[1]).params).toContain(evaluationId);
  });
  it("PROJ-BREAK-idor-57 learner, wrong tenant and invalid submission ID cannot see unpublished rubric",async()=>{
    state.access="LEARNER";
    await expect(getProjectEvaluation(actor,projectId,submissionId))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    await expect(listProjectEvaluations(actor,projectId))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    state.access="ADMIN";state.denied=true;
    await expect(getProjectEvaluation(actor,projectId,submissionId))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    state.denied=false;
    await expect(getProjectEvaluation(actor,projectId,"bad-id")).rejects.toThrow();
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-grading-04 empty evaluation returns null or empty list without an item query",async()=>{
    state.hasEvaluation=false;
    expect(await getProjectEvaluation(actor,projectId,submissionId)).toBeNull();
    expect(state.reads).toBe(1);
    state.reads=0;state.conditions=[];
    const list=await listProjectEvaluations(actor,projectId);
    expect(list).toEqual({evaluations:[],items:[]});
    expect(state.reads).toBe(1);
  });
});
