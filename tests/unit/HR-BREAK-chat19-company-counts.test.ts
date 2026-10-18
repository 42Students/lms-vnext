import {describe,expect,it} from "vitest";
import {buildRecruiterCompanyOverview} from "@/modules/placements/recruiter-company-overview-model";
const college="11111111-1111-4111-8111-111111111111";
const relation="22222222-2222-4222-8222-222222222222";
function job(id:string,status:string,overrides:{collegeId?:string;relationshipId?:string;archivedAt?:Date|null}={}){
 return {collegeId:overrides.collegeId??college,relationshipId:overrides.relationshipId??relation,
  job:{id,title:id,status,archivedAt:overrides.archivedAt??null}};
}
describe("HR-BREAK-COMPANY-COUNTS-50: never double-count authorized recruiter drives",()=>{
 it("counts each underlying published/closed job only once after duplicate grant joins",()=>{
  const rows=[job("a","PUBLISHED"),job("a","PUBLISHED"),job("b","CLOSED"),
   job("b","CLOSED"),job("c","PUBLISHED")];
  const summary=buildRecruiterCompanyOverview(rows,college,relation);
  expect(summary).toMatchObject({total:3,active:2,closed:1});
  expect(summary.recent.map(x=>x.id)).toEqual(["a","b","c"]);
  expect(rows).toHaveLength(5);
 });
 it("filters archived, draft, unrelated college and foreign employer relationship rows before dedupe",()=>{
  const rows=[job("archived","PUBLISHED",{archivedAt:new Date("2099-01-01")}),
   job("draft","DRAFT"),job("other-college","PUBLISHED",{collegeId:"33333333-3333-4333-8333-333333333333"}),
   job("other-company","PUBLISHED",{relationshipId:"44444444-4444-4444-8444-444444444444"}),
   job("visible","PUBLISHED")];
  const summary=buildRecruiterCompanyOverview(rows,college,relation);
  expect(summary.total).toBe(1);
  expect(summary.recent.map(x=>x.id)).toEqual(["visible"]);
 });
 it("preserves first authorized occurrence order for the bounded recent section",()=>{
  const rows=[job("first","CLOSED"),job("second","PUBLISHED"),job("first","CLOSED"),
   job("third","PUBLISHED"),job("fourth","PUBLISHED")];
  const summary=buildRecruiterCompanyOverview(rows,college,relation);
  expect(summary.recent.map(x=>x.id)).toEqual(["first","second","third"]);
 });
 it("empty or unrelated company lists never fabricate employer counts",()=>{
  expect(buildRecruiterCompanyOverview([],college,relation)).toEqual({
   active:0,closed:0,total:0,recent:[],
  });
  expect(buildRecruiterCompanyOverview([job("x","PUBLISHED")],college,"other")).toMatchObject({total:0,active:0});
 });
});
