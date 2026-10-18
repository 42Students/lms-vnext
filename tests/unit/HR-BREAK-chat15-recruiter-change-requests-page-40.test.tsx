import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 ctx:vi.fn(),read:vi.fn(),notFound:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.ctx}));
vi.mock("@/modules/placements/tpo-drive-change-request-service",()=>({
 getDriveChangeRequests:mocks.read,
}));
vi.mock("next/navigation",()=>({
 notFound:mocks.notFound,
}));
vi.mock("next/link",()=>({
 default:({href,children}:{href:string;children:React.ReactNode})=>
  React.createElement("a",{href},children),
}));
vi.mock("@/components/ui/page-header",()=>({
 PageHeader:({title}:{title:string})=>React.createElement("h1",null,title),
}));
vi.mock("@/components/placements/tpo-drive-change-requests",()=>({
 TpoDriveChangeRequests:({jobId,party}:{jobId:string;party:string})=>
  React.createElement("div",{"data-testid":"company-request-list","data-job-id":jobId},party),
}));

import RecruiterChangeRequestsPage
 from "@/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page";
import {PlacementsServiceError} from "@/modules/placements/errors";

const jobId="123e4567-e89b-42d3-a456-426614174001";
const params={params:Promise.resolve({jobId})};
const account={user:{id:"recruiter-a",platformStatus:"ACTIVE"}};
const ready={job:{title:"Graduate Engineer"},party:"COMPANY",
 storageReady:true,pendingMessage:"",requests:[]};

describe("HR-CHANGE-REQUESTS-PAGE-40 protected recruiter drive page rendering",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.ctx.mockResolvedValue(account);
  mocks.read.mockResolvedValue(ready);
  mocks.notFound.mockImplementation(()=>{throw new Error("NEXT_HTTP_404");});
 });
 it("uses authenticated context and scoped job ID before showing company change requests",async()=>{
  const view=await RecruiterChangeRequestsPage(params);
  const html=renderToStaticMarkup(view);
  expect(mocks.read).toHaveBeenCalledWith(account,jobId);
  expect(html).toContain("Graduate Engineer · Change requests");
  expect(html).toContain('data-testid="company-request-list"');
  expect(html).toContain("COMPANY");
  expect(html).toContain("Back to drive");
  expect(html).toContain("/recruiter/drives/"+jobId);
 });
 it("a TPO or different requester party never sees this company's discussion page",async()=>{
  mocks.read.mockResolvedValue({...ready,party:"TPO"});
  await expect(RecruiterChangeRequestsPage(params)).rejects.toThrow("NEXT_HTTP_404");
  expect(mocks.notFound).toHaveBeenCalledTimes(1);
 });
 it("a foreign job is indistinguishable from a nonexistent job",async()=>{
  mocks.read.mockRejectedValue(new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND"));
  await expect(RecruiterChangeRequestsPage(params)).rejects.toThrow("NEXT_HTTP_404");
  expect(mocks.notFound).toHaveBeenCalledTimes(1);
 });
 it("a missing storage prerequisite renders a safe non-submission status, never an editable request widget",async()=>{
  mocks.read.mockResolvedValue({...ready,storageReady:false,
   pendingMessage:"Storage is temporarily unavailable."});
  const view=await RecruiterChangeRequestsPage(params);
  const html=renderToStaticMarkup(view);
  expect(html).toContain('role="status"');
  expect(html).toContain("Storage is temporarily unavailable.");
  expect(html).toContain("The college cannot receive changes here until registration is complete.");
  expect(html).not.toContain('data-testid="company-request-list"');
 });
});
