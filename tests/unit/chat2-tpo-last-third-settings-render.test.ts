import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 context:vi.fn(),link:vi.fn(),blocked:vi.fn(),redirect:vi.fn(),
 header:vi.fn(),nav:vi.fn(),card:vi.fn(),editor:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("next/navigation",()=>({redirect:state.redirect}));
vi.mock("@/modules/placements/tpo-public-join-link-service",()=>({
 getTpoPublicJoinLinkStatus:state.link,
}));
vi.mock("@/modules/placements/tpo-configuration-read-service",()=>({
 getTpoBlockedDates:state.blocked,
}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:state.header}));
vi.mock("@/components/placements/tpo-settings-nav",()=>({TpoSettingsNav:state.nav}));
vi.mock("@/components/tpo/tpo-public-join-link-card",()=>({TpoPublicJoinLinkCard:state.card}));
vi.mock("@/components/tpo/tpo-blocked-dates-editor",()=>({TpoBlockedDatesEditor:state.editor}));
import PublicLinkPage from "@/app/(authenticated)/tpo/settings/public-link/page";
import BlockedDatesPage from "@/app/(authenticated)/tpo/settings/blocked-dates/page";

const ctx=(role:"TPO"|"COLLEGE_ADMIN"|"LEARNER"="TPO"):RequestContext=>({
 user:{id:"person",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"m",collegeId:"college-1",organizationId:"org-1",status:"ACTIVE",roles:[role]},
});
beforeEach(()=>{
 vi.clearAllMocks();
 state.context.mockResolvedValue(ctx());
 state.link.mockResolvedValue({ready:false,domain:null,link:null});
 state.blocked.mockResolvedValue({ready:false,rows:[]});
 state.header.mockReturnValue(null);
 state.nav.mockReturnValue(null);
 state.card.mockReturnValue(null);
 state.editor.mockReturnValue(null);
 state.redirect.mockImplementation(()=>{throw new Error("TPO_REDIRECT")});
});

describe("UX-tpo-LAST-THIRD-01 TPO settings server-page states",()=>{
 it("UX-tpo-LAST-THIRD-01 public recruiter links are read in the authenticated college only",async()=>{
  const tree=await PublicLinkPage();
  renderToStaticMarkup(tree);
  expect(state.link).toHaveBeenCalledWith(expect.objectContaining({
   membership:expect.objectContaining({collegeId:"college-1"}),
  }),"COLLEGE");
  expect(state.header).toHaveBeenCalledWith(expect.objectContaining({
   title:"Public recruiter link",
  }),undefined);
  expect(state.card).toHaveBeenCalledWith(expect.objectContaining({
   scope:"COLLEGE",initial:{ready:false,domain:null,link:null},
  }),undefined);
 });
 it("UX-tpo-LAST-THIRD-01 personal public-link settings deny non-TPO before retrieving a bearer-link status",async()=>{
  for(const role of ["COLLEGE_ADMIN","LEARNER"] as const){
   state.context.mockResolvedValueOnce(ctx(role));
   await expect(PublicLinkPage()).rejects.toThrow("TPO_REDIRECT");
  }
  state.context.mockResolvedValueOnce({...ctx(),membership:null});
  await expect(PublicLinkPage()).rejects.toThrow("TPO_REDIRECT");
  expect(state.link).not.toHaveBeenCalled();
 });
 it("UX-tpo-LAST-THIRD-01 renders honest blocked-date unavailable state without an empty list claim",async()=>{
  const html=renderToStaticMarkup(await BlockedDatesPage());
  expect(html).toContain("Blocked-date storage is pending migration registration.");
  expect(html).toContain('role="status"');
  expect(state.editor).not.toHaveBeenCalled();
  expect(state.header).toHaveBeenCalledWith(expect.objectContaining({title:"Blocked dates"}),undefined);
 });
 it("UX-tpo-LAST-THIRD-01 preserves persisted UTC update tokens while showing a ready blocked-date editor",async()=>{
  const at=new Date("2099-07-03T10:30:00.123Z");
  state.blocked.mockResolvedValueOnce({ready:true,rows:[{
   id:"blocked-date",onDate:"2099-07-04",reason:"College exams",updatedAt:at,
  }]});
  const html=renderToStaticMarkup(await BlockedDatesPage());
  expect(html).not.toContain("storage is pending");
  expect(state.editor).toHaveBeenCalledWith(expect.objectContaining({
   items:[expect.objectContaining({
    id:"blocked-date",updatedAt:"2099-07-03T10:30:00.123Z",
   })],
  }),undefined);
 });
});
