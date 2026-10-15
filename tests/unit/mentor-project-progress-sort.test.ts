import{it,expect}from"vitest";import{compareMentorProjectsByProgress as sort}from"@/modules/projects/mentor-project-order-model";import{mentorProjectListQuerySchema}from"@/modules/projects/mentor-project-list-query";
const a={id:"a",title:"A",status:"ACTIVE",updatedAt:new Date("2026-10-01")};
const b={...a,id:"b",title:"B",updatedAt:new Date("2026-10-02")};
it("sorts measured least progress first, unknown last",()=>{expect(sort(a,b,20,75)).toBeLessThan(0);expect(sort(a,b,undefined,20)).toBeGreaterThan(0)});
it("keeps archived projects last",()=>expect(sort({...a,status:"ARCHIVED"},b,0,100)).toBeGreaterThan(0));
it("registers the URL selector",()=>expect(mentorProjectListQuerySchema.parse({sort:"PROGRESS"}).sort).toBe("PROGRESS"));