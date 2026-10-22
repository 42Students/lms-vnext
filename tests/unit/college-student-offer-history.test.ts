import {describe,expect,it} from "vitest";
import {relevantStudentApplicationOffers} from "@/modules/placements/college-placement-student-lookup-model";

describe("G2-15-002-057 college placement applications have one authoritative offer",()=>{
 it("keeps one history row and selects joined older offers over later revoked offers",()=>{
  const offers=[
   {applicationId:"a",status:"REVOKED",joining:null,id:"new"},
   {applicationId:"a",status:"ACCEPTED",joining:"JOINED",id:"old"},
   {applicationId:"b",status:"ISSUED",joining:null,id:"b-new"},
   {applicationId:"b",status:"SELECTED_NOT_RELEASED",joining:null,id:"b-old"},
  ];
  const chosen=relevantStudentApplicationOffers(offers);
  expect(chosen.size).toBe(2);
  expect(chosen.get("a")?.id).toBe("old");
  expect(chosen.get("b")?.id).toBe("b-new");
 });
 it("uses latest issue-date order for equal-priority offers and never changes caller input",()=>{
  const offers=[
   {applicationId:"a",status:"ACCEPTED",joining:null,id:"new"},
   {applicationId:"a",status:"ACCEPTED",joining:null,id:"old"},
  ];
  expect(relevantStudentApplicationOffers(offers).get("a")?.id).toBe("new");
  expect(offers.map(o=>o.id)).toEqual(["new","old"]);
 });
});
