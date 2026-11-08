import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { recruiterDriveMessageHref } from "@/modules/placements/recruiter-drive-navigation";
import G081ChangeError from "@/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error";
import G081DetailError from "@/app/(authenticated)/recruiter/drives/[jobId]/error";
import G081InterviewError from "@/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/error";
import G081MessagesError from "@/app/(authenticated)/recruiter/drives/[jobId]/messages/error";
import G081RoundsError from "@/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/error";
import G081RemoveError from "@/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/error";
import G082CreateError from "@/app/(authenticated)/recruiter/drives/new/error";
import G082ProposalsError from "@/app/(authenticated)/recruiter/drives/proposals/error";
import G082OutsideError from "@/app/(authenticated)/recruiter/drives/recorded-outside/error";
import G082HomeError from "@/app/(authenticated)/recruiter/home/error";
import G082MessagesError from "@/app/(authenticated)/recruiter/messages/error";
import G082ProfileError from "@/app/(authenticated)/recruiter/profile/error";
import G081ChangeLoading from "@/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading";
import G081DetailLoading from "@/app/(authenticated)/recruiter/drives/[jobId]/loading";
import G082CreateLoading from "@/app/(authenticated)/recruiter/drives/new/loading";
import G082ProposalsLoading from "@/app/(authenticated)/recruiter/drives/proposals/loading";
import G082OutsideLoading from "@/app/(authenticated)/recruiter/drives/recorded-outside/loading";

describe("UX-G081 / G082 recruiter drive consistency",()=>{
  const error=new Error("SENSITIVE_SOURCE_DO_NOT_DISPLAY");
  it("keeps all 12 recruiter drive alias recovery destinations in Today",()=>{
    for(const ErrorBoundary of [G081ChangeError,G081DetailError,G081InterviewError,G081MessagesError,
      G081RoundsError,G081RemoveError,G082CreateError,G082ProposalsError,G082OutsideError,
      G082HomeError,G082MessagesError,G082ProfileError]){
      const html=renderToStaticMarkup(<ErrorBoundary error={error} reset={()=>{}} />);
      expect(html).toContain('href="/recruiter/home"');
      expect(html).toContain("Try again");
      expect(html).not.toContain("SENSITIVE_SOURCE_DO_NOT_DISPLAY");
    }
  });
  it("preserves selected drive context in its discussion link",()=>{
    const id="123e4567-e89b-42d3-a456-426614174000";
    expect(recruiterDriveMessageHref(id)).toBe("/recruiter/drives/"+id+"/messages");
    expect(recruiterDriveMessageHref("../unexpected?college=another"))
      .toContain("..%2Funexpected%3Fcollege%3Danother/messages");
  });
  it("names each new/edited route transition as one accessible loading status",()=>{
    for(const Loading of [G081ChangeLoading,G081DetailLoading,G082CreateLoading,
      G082ProposalsLoading,G082OutsideLoading]){
      const html=renderToStaticMarkup(<Loading/>);
      expect((html.match(/role="status"/g)??[])).toHaveLength(1);
      expect(html).toContain('aria-busy="true"');
    }
  });
});
