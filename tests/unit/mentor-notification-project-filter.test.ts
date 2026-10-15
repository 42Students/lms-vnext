import{it,expect}from"vitest";import{mentorAttentionProjectSchema as schema,selectMentorAttention as filter}from"@/modules/projects/mentor-attention-kind-model";
const p="10000000-0000-4000-8000-000000000001",q="10000000-0000-4000-8000-000000000002";
const row=(projectId:string)=>({projectId,key:projectId,kind:"REVIEW"as const,title:"Review",description:"Review",href:"/mentor",occurredAt:"2026-10-15T00:00:00Z"});
it("matches project only after authorized attention was retrieved",()=>expect(filter([row(p),row(q)],"ALL",p)).toEqual([row(p)]));
it("validates optional exact Project UUID selector",()=>{expect(schema.parse("")).toBeUndefined();expect(schema.parse(p)).toBe(p);expect(schema.safeParse("bad").success).toBe(false)});