import {describe,expect,it} from "vitest";
import {ownApplicationInterviewLinks} from "@/modules/placements/learner-application-interview-links-model";
const a="81818181-8181-4818-8818-818181818181";
const earlier="82828282-8282-4828-8828-828282828282";
const later="83838383-8383-4838-8838-838383838383";
describe("learner own-application exact interview links",()=>{
 it("selects nearest upcoming own interview over past and assessment",()=>{
  const links=ownApplicationInterviewLinks([
    {applicationId:a,roundId:earlier,roundKind:"INTERVIEW",
      scheduledAt:"2026-10-10T07:00:00Z",exception:null},
    {applicationId:a,roundId:later,roundKind:"INTERVIEW",
      scheduledAt:"2026-10-17T07:00:00Z",exception:null},
    {applicationId:a,roundId:"assessment",roundKind:"TEST",scheduledAt:null,exception:null},
  ],"2026-10-14T00:00:00Z");
  expect(links).toEqual([{applicationId:a,
    href:"/learn/my-placements/interviews?applicationId="+a+"&roundId="+later}]);
 });
 it("does not fabricate any interview link for an application without an interview round",()=>{
  expect(ownApplicationInterviewLinks([
    {applicationId:a,roundId:earlier,roundKind:"TEST",scheduledAt:null,exception:null},
  ],"2026-10-14T00:00:00Z")).toEqual([]);
 });
});
