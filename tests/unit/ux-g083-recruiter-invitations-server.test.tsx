import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { redirect } from "next/navigation";
import { SessionAuthenticationError } from "@/auth/session";
import { renderToStaticMarkup } from "react-dom/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listSignedInRecruiterPendingInvites } from "@/modules/placements/public-recruiter-invite-accept-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import RecruiterInvitationsPage from "@/app/(authenticated)/recruiter-invitations/page";

vi.mock("next/navigation", () => ({redirect:vi.fn((href:string)=>{throw new Error("REDIRECT:"+href);})}));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/modules/placements/public-recruiter-invite-accept-service", () => ({
  listSignedInRecruiterPendingInvites: vi.fn(),
}));
vi.mock("@/components/hr/recruiter-pending-invitations", () => ({
  RecruiterPendingInvitations: ({ invitations, total }: {
    invitations: readonly {collegeName:string}[]; total:number;
  }) => createElement("section", { "data-pending-count": String(total) },
    invitations.map(x=>x.collegeName).join(",")),
}));
const render=async()=>renderToStaticMarkup(await RecruiterInvitationsPage());
const context={user:{id:"signed-in-user",platformStatus:"ACTIVE"}};
beforeEach(()=>{
  vi.resetAllMocks();
  vi.mocked(redirect).mockImplementation((href: string) => {throw new Error("REDIRECT:"+href);});
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
  vi.mocked(listSignedInRecruiterPendingInvites).mockResolvedValue([] as never);
});

describe("UX-G083 pending invitations cannot escape actor scope",()=>{
 it("renders an actionable no-pending state for an authorized signed-in identity",async()=>{
   const html=await render();
   expect(html).toContain("Recruiter invitations");
   expect(html).toContain("No pending recruiter invitations");
   expect(html).toContain("Back to dashboard");
   expect(listSignedInRecruiterPendingInvites).toHaveBeenCalledExactlyOnceWith(context);
 });
 it("renders only the server-selected actor's pending invitations",async()=>{
   vi.mocked(listSignedInRecruiterPendingInvites).mockResolvedValue([
     {collegeId:"college-a",collegeName:"Example College",company:"Example Co",invitedContact:null}
   ] as never);
   const html=await render();
   expect(html).toContain('data-pending-count="1"');
   expect(html).toContain("Example College");
   expect(html).not.toContain("No pending recruiter invitations");
   expect(listSignedInRecruiterPendingInvites).toHaveBeenCalledExactlyOnceWith(context);
 });
 it.each([
   ["SESSION_MISSING",null],
   ["SESSION_EXPIRED","expired"],
   ["SESSION_REVOKED","revoked"],
   ["SESSION_INVALID","invalid"],
   ["RECENT_SIGN_IN_REQUIRED","recent"],
 ] as const)("routes %s to first-party fresh sign-in, never querying invites",async(code,reason)=>{
   vi.mocked(getCurrentRequestContext).mockRejectedValue(new SessionAuthenticationError(code));
   await expect(RecruiterInvitationsPage()).rejects.toThrow("REDIRECT:/login?");
   const href=vi.mocked(redirect).mock.calls[0]?.[0];
   const url=new URL(href!,"https://lms.invalid");
   expect(url.pathname).toBe("/login");
   expect(url.searchParams.get("returnTo")).toBe("/recruiter-invitations");
   expect(url.searchParams.get("auth")).toBe(reason);
   expect(listSignedInRecruiterPendingInvites).not.toHaveBeenCalled();
 });
 it("does not query invitations for suspended identities",async()=>{
   vi.mocked(getCurrentRequestContext).mockResolvedValue({user:{platformStatus:"SUSPENDED"}} as never);
   await expect(RecruiterInvitationsPage()).rejects.toBeInstanceOf(AuthorizationError);
   expect(listSignedInRecruiterPendingInvites).not.toHaveBeenCalled();
 });
 it("preserves a real authorization denial rather than presenting retry",async()=>{
   vi.mocked(listSignedInRecruiterPendingInvites).mockRejectedValue(new AuthorizationError("placements.recruiter.read"));
   await expect(RecruiterInvitationsPage()).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("offers safe retry and no private database details for transient failures",async()=>{
   vi.mocked(listSignedInRecruiterPendingInvites).mockRejectedValue(new Error("private database connection secret"));
   const html=await render();
   expect(html).toContain("Could not load your invitations");
   expect(html).toContain("No invitation has been accepted or declined");
   expect(html).toContain("Retry");
   expect(html).not.toContain("private database connection secret");
 });
});
