import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),active:vi.fn(),notFound:vi.fn(),redirect:vi.fn(),
 choices:vi.fn(),confirm:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:mocks.active}));
vi.mock("next/navigation",()=>({notFound:mocks.notFound,redirect:mocks.redirect}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:React.ReactNode})=>
  React.createElement("a",{href},children),
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title}:{title:string})=>React.createElement("h1",null,title),
}));
vi.mock("@/components/placements/recorded-outside-form",()=>({
 RecordedOutsideForm:({collegeId}:{collegeId:string})=>
  React.createElement("section",{"data-college":collegeId},"Outside-drive form"),
}));
vi.mock("@/modules/placements/recorded-outside-service",()=>({
 recordedOutsideChoices:mocks.choices,verifyRecordedOutsideConfirmation:mocks.confirm,
}));
import HrRecordedOutsidePage from "@/app/(authenticated)/hr/drives/recorded-outside/page";

const college="123e4567-e89b-42d3-a456-426614174001";
const other="123e4567-e89b-42d3-a456-426614174002";
const grant={id:"grant-a",collegeId:college,collegeName:"College A"};
const actor={user:{id:"recruiter-a",platformStatus:"ACTIVE"},
 recruiter:{userId:"recruiter-a",status:"ACTIVE",grants:[grant]}};
function query(params:{collegeId?:string|string[];saved?:string|string[]}={}){
 return {searchParams:Promise.resolve(params)};
}
describe("HR-RECORDED-QUERY-51: archived/external drive page session and URL boundaries",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(actor);
  mocks.active.mockReturnValue(true);
  mocks.notFound.mockImplementation(()=>{throw new Error("NEXT_HTTP_404");});
  mocks.redirect.mockImplementation(()=>{throw new Error("NEXT_REDIRECT");});
  mocks.choices.mockResolvedValue({choices:[{id:"option-a"}]});
  mocks.confirm.mockResolvedValue(false);
 });
 it("inactive recruiter redirects before external drive query and any storage lookup",async()=>{
  mocks.active.mockReturnValue(false);
  await expect(HrRecordedOutsidePage(query())).rejects.toThrow("NEXT_REDIRECT");
  expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  expect(mocks.choices).not.toHaveBeenCalled();
  expect(mocks.confirm).not.toHaveBeenCalled();
 });
 it("one granted college can display a bounded external record form without publishing a job",async()=>{
  const html=renderToStaticMarkup(await HrRecordedOutsidePage(query()));
  expect(mocks.choices).toHaveBeenCalledWith(actor,college);
  expect(html).toContain("Record an outside-platform drive");
  expect(html).toContain("Historical employer-college record only.");
  expect(html).toContain('data-college="'+college+'"');
  expect(html).toContain("Back to drive request");
  expect(mocks.confirm).not.toHaveBeenCalled();
 });
 it("multiple grants require an explicit college selection, not an arbitrary default",async()=>{
  mocks.context.mockResolvedValue({...actor,recruiter:{...actor.recruiter,grants:[
   grant,{...grant,id:"grant-b",collegeId:other,collegeName:"College B"},
  ]}});
  const html=renderToStaticMarkup(await HrRecordedOutsidePage(query()));
  expect(html).toContain("Choose a college for the external drive");
  expect(html).toContain("College A");
  expect(html).toContain("College B");
  expect(mocks.choices).not.toHaveBeenCalled();
 });
 it("rejects foreign and malformed college IDs before service reads",async()=>{
  for(const candidate of ["not-a-uuid",other]){
   await expect(HrRecordedOutsidePage(query({collegeId:candidate})))
    .rejects.toThrow("NEXT_HTTP_404");
  }
  expect(mocks.choices).not.toHaveBeenCalled();
  expect(mocks.confirm).not.toHaveBeenCalled();
 });
 it("rejects duplicate college or saved query keys rather than silently taking a different tenant",async()=>{
  for(const param of [
   {collegeId:[college,other]},
   {collegeId:[college,college]},
   {collegeId:college,saved:["a","b"]},
   {saved:["a","b"]},
  ]){
   await expect(HrRecordedOutsidePage(query(param))).rejects.toThrow("NEXT_HTTP_404");
  }
  expect(mocks.choices).not.toHaveBeenCalled();
  expect(mocks.confirm).not.toHaveBeenCalled();
 });
 it("saved status requires independently confirmed recruiter-owned record ID",async()=>{
  mocks.confirm.mockResolvedValue(true);
  const html=renderToStaticMarkup(await HrRecordedOutsidePage(query({
   collegeId:college,saved:"saved-record",
  })));
  expect(mocks.confirm).toHaveBeenCalledWith(actor,college,"saved-record");
  expect(html).toContain("External drive record saved. It was not published as a job.");
  expect(html).toContain('role="status"');
 });
});
