import{it,expect}from"vitest";import{compareMentorProjects as c}from"@/modules/projects/mentor-project-order-model";
const p=[{id:"b",title:"Zeta",status:"ACTIVE",updatedAt:new Date("2026-01-02")},{id:"a",title:"Alpha",status:"ACTIVE",updatedAt:new Date("2026-01-01")},{id:"c",title:"Archive",status:"ARCHIVED",updatedAt:new Date("2026-01-03")}];
it("sorts by latest update",()=>expect([...p].sort((a,b)=>c(a,b,"RECENT")).map(x=>x.id)).toEqual(["b","a","c"]));
it("supports title order with archived last",()=>expect([...p].sort((a,b)=>c(a,b,"TITLE")).map(x=>x.id)).toEqual(["a","b","c"]));
it("uses stable id for matching titles and times",()=>expect(c({...p[0],id:"a"},p[0],"RECENT")).toBeLessThan(0));