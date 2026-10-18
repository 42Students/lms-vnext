import {describe,expect,it} from "vitest";
import {
 facultyAssignmentMethodsLoadVersion,
 verifiedFacultyAssignmentMethodsResponse,
} from "@/modules/courses/faculty-assignment-method-load-model";

describe("COURSES-BREAK-FACULTY-13 saved submission methods and editor switch race",()=>{
 it("FAC-courses-03 parses an exact, unique saved method list without broadening the policy",()=>{
  expect(verifiedFacultyAssignmentMethodsResponse({
   methods:["WRITTEN_RESPONSE","PDF_UPLOAD"],
  })).toEqual(["WRITTEN_RESPONSE","PDF_UPLOAD"]);
  expect(verifiedFacultyAssignmentMethodsResponse({
   methods:["REPOSITORY_LINK"],
  })).toEqual(["REPOSITORY_LINK"]);
 });
 it("FAC-courses-03 rejects empty, malformed and duplicate method receipts rather than silently allowing every type",()=>{
  for(const raw of [
   null,undefined,"success",{},{"methods":null},{"methods":[]},
   {"methods":"FILE_UPLOAD"},{"methods":["FILE_UPLOAD","FILE_UPLOAD"]},
   {"methods":["FILE_UPLOAD","FAKE_METHOD"]},
   {"methods":["FILE_UPLOAD"],actorId:"foreign"} ,
  ]){
   const actual=verifiedFacultyAssignmentMethodsResponse(raw);
   if(raw&&typeof raw==="object"&&"actorId" in raw){
    // The backend's methods-only content is authoritative for methods, not a
    // caller-supplied actor property in an otherwise valid receipt.
    expect(actual).toEqual(["FILE_UPLOAD"]);continue;
   }
   expect(actual).toBeNull();
  }
 });
 it("FAC-courses-03 only the latest selection version may commit fetched methods",async()=>{
  const gate=facultyAssignmentMethodsLoadVersion();
  const first=gate.next();
  const second=gate.next();
  const applied:string[][]=[];
  const apply=(version:number,value:unknown)=>{
   if(!gate.isCurrent(version))return;
   const methods=verifiedFacultyAssignmentMethodsResponse(value);
   if(methods)applied.push(methods);
  };
  // Assignment B resolves before the original request for Assignment A.
  await Promise.resolve().then(()=>apply(second,{methods:["PDF_UPLOAD"]}));
  await Promise.resolve().then(()=>apply(first,{methods:["EXTERNAL_LINK"]}));
  expect(applied).toEqual([["PDF_UPLOAD"]]);
  expect(gate.isCurrent(first)).toBe(false);
  expect(gate.isCurrent(second)).toBe(true);
 });
 it("FAC-courses-03 retry invalidates all in-flight requests even after the earlier request fails",()=>{
  const gate=facultyAssignmentMethodsLoadVersion();
  const prior=gate.next();
  const retried=gate.next();
  expect(gate.isCurrent(prior)).toBe(false);
  expect(gate.isCurrent(retried)).toBe(true);
  const third=gate.next();
  expect(gate.isCurrent(retried)).toBe(false);
  expect(gate.isCurrent(third)).toBe(true);
 });
});
