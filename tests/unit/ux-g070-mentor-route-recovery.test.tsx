import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MentorProjectFilterError } from "@/components/projects/mentor-project-filter-error";
import MentorNotificationsError from "@/app/(authenticated)/mentor/notifications/error";
import MentorNotificationsLoading from "@/app/(authenticated)/mentor/notifications/loading";
import MentorBoardError from "@/app/(authenticated)/mentor/projects/[projectId]/board-review/error";
import MentorActivityError from "@/app/(authenticated)/mentor/projects/[projectId]/activity-history/error";
import MentorBoardLoading from "@/app/(authenticated)/mentor/projects/[projectId]/board-review/loading";
import MentorActivityLoading from "@/app/(authenticated)/mentor/projects/[projectId]/activity-history/loading";

describe("UX-G070 mentor project navigation and recovery",()=>{
  const project="123e4567-e89b-42d3-a456-426614174000";
  it("clears invalid board filters without losing project context",()=>{
    const html=renderToStaticMarkup(<MentorProjectFilterError kind="board" projectId={project}/>);
    expect(html).toContain('href="/mentor/projects/'+project+'/board-review"');
    expect(html).toContain('href="/mentor/projects/'+project+'"');
    expect(html).not.toContain('href="/mentor/projects"');
    expect(html).toContain('role="alert"');
  });
  it("clears invalid activity filters in the same assigned project",()=>{
    const html=renderToStaticMarkup(<MentorProjectFilterError kind="activity" projectId={project}/>);
    expect(html).toContain('href="/mentor/projects/'+project+'/activity-history"');
    expect(html).toContain("Back to this project");
  });
  it("fails safely when the identifier includes URL punctuation",()=>{
    const html=renderToStaticMarkup(<MentorProjectFilterError kind="board" projectId="../other?bad=1"/>);
    expect(html).toContain("%2Fother%3Fbad%3D1");
    expect(html).not.toContain('href="/mentor/projects/../other');
  });
  it("keeps notification error explanations private and retryable",()=>{
    const html=renderToStaticMarkup(<MentorNotificationsError error={new Error("PRIVATE_LOG_RESPONSE")} reset={()=>{}}/>);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Retry notifications");
    expect(html).toContain('href="/mentor/projects"');
    expect(html).not.toContain("PRIVATE_LOG_RESPONSE");
  });
  it("provides project exits from board/activity failures without losing retry",()=>{
    for(const Component of [MentorBoardError,MentorActivityError]){
      const html=renderToStaticMarkup(<Component error={new Error("PRIVATE")} reset={()=>{}} />);
      expect(html).toContain("Retry");
      expect(html).toContain('href="/mentor/projects"');
      expect(html).not.toContain("PRIVATE");
    }
  });
  it("announces exactly one loading status for each mentor subroute",()=>{
    for(const Component of [MentorNotificationsLoading,MentorBoardLoading,MentorActivityLoading]){
      const html=renderToStaticMarkup(<Component />);
      expect((html.match(/role="status"/g)||[])).toHaveLength(1);
      expect(html).toContain('aria-busy="true"');
    }
  });
});
