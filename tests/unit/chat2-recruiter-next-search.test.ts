import {describe,it,expect} from "vitest";
import {nextTpoRecruiterGrantPage,tpoRecruiterAccessQuerySchema} from "../../src/modules/placements/tpo-recruiter-access-model";

describe("recruiter grant filtered pagination",()=>{
 it("preserves search and status on Next",()=>{
  const query=tpoRecruiterAccessQuerySchema.parse({status:"REVOKED",q:"A & B",page:2});
  const next=new URL(nextTpoRecruiterGrantPage(query,2),"http://test.invalid");
  expect(next.searchParams.get("q")).toBe("A & B");
  expect(next.searchParams.get("status")).toBe("REVOKED");
  expect(next.searchParams.get("page")).toBe("3");
 });
 it("does not introduce a synthetic status when ALL",()=>{
  const query=tpoRecruiterAccessQuerySchema.parse({});
  expect(nextTpoRecruiterGrantPage(query,1)).toBe("/tpo/settings/recruiters?page=2");
 });
});
