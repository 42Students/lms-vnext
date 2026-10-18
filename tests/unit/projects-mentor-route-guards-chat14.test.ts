import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const base="src/app/api/projects/[projectId]/";
const routes=[
  {
    "path": "sprints/route.ts",
    "methods": [
      "POST"
    ],
    "service": "createMentorProjectSprint"
  },
  {
    "path": "sprints/[sprintId]/mentor-transition/route.ts",
    "methods": [
      "POST"
    ],
    "service": "transitionMentorProjectSprint"
  },
  {
    "path": "sprints/[sprintId]/route.ts",
    "methods": [
      "PATCH",
      "DELETE"
    ],
    "service": "updateMentorSprintDetails"
  },
  {
    "path": "tasks/route.ts",
    "methods": [
      "POST"
    ],
    "service": "createMentorProjectTask"
  },
  {
    "path": "tasks/[taskId]/details/route.ts",
    "methods": [
      "PATCH"
    ],
    "service": "updateMentorTaskDetails"
  },
  {
    "path": "tasks/[taskId]/mentor-transition/route.ts",
    "methods": [
      "PATCH"
    ],
    "service": "transitionMentorProjectTask"
  },
  {
    "path": "meetings/[meetingId]/mentor-decision/route.ts",
    "methods": [
      "POST"
    ],
    "service": "decideMentorProjectMeeting"
  },
  {
    "path": "meetings/[meetingId]/mentor-reschedule/route.ts",
    "methods": [
      "PATCH"
    ],
    "service": "rescheduleMentorMeeting"
  },
  {
    "path": "releases/route.ts",
    "methods": [
      "POST"
    ],
    "service": "writeMentorProjectRelease"
  },
  {
    "path": "releases/[releaseId]/route.ts",
    "methods": [
      "PATCH",
      "DELETE"
    ],
    "service": "writeMentorProjectRelease"
  }
] as const;

describe("chat-14 mentor route guards and friendly API error handling",()=>{
  for(const route of routes){
    it(`guards ${route.path} before decoding writes and delegates through authenticated service`,()=>{
      const source=readFileSync(base+route.path,"utf8");
      expect(source).toContain("isSameOriginRequest");
      expect(source).toContain("getCurrentRequestContext");
      expect(source).toContain(route.service);
      expect(source).toContain("apiErrorResponse(error)");
      expect(source).toContain("status:403");
      // Bounded JSON readers are stronger than direct request.json(). The
      // origin guard still must precede either decoder, never merely its import.
      const decoder=source.includes("readMentorProjectCommandBody(request)")
        ?"readMentorProjectCommandBody(request)":"request.json()";
      expect(source).toContain(decoder);
      expect(source.indexOf("isSameOriginRequest(request)")).toBeGreaterThanOrEqual(0);
      expect(source.indexOf("isSameOriginRequest(request)")).toBeLessThan(source.lastIndexOf(decoder));
      if(decoder==="readMentorProjectCommandBody(request)"){
        expect(source).toContain("MentorProjectCommandBodyError");
        expect(source).toContain("mentorProjectBodyFailureMessage(error.status)");
      }
      for(const method of route.methods){
        expect(source).toMatch(new RegExp("export\\s+async\\s+function\\s+"+method+"\\s*\\("));
      }
      // Mutating handlers may never expose exception messages directly.
      expect(source).not.toContain("error.message");
      expect(source).not.toContain("error.stack");
    });
  }
  it("selects mentor or learner task creation by authenticated project access, not posted role",()=>{
    const src=readFileSync(base+"tasks/route.ts","utf8");
    expect(src).toContain("requireProjectReadAccess(context,path.projectId)");
    expect(src).toContain('scope.access==="LEARNER"');
    expect(src).toContain("createLearnerOwnTask");
    expect(src).toContain("createMentorProjectTask");
  });
  it("requires a confirmed release version from a same-origin authenticated DELETE",()=>{
    const src=readFileSync(base+"releases/[releaseId]/route.ts","utf8");
    expect(src).toContain('releaseId,"DELETE",await request.json()');
    expect(src.indexOf("isSameOriginRequest(request)")).toBeLessThan(src.indexOf('"DELETE",await request.json()'));
    expect(src).toContain("writeMentorProjectRelease");
    const client=readFileSync("src/components/projects/mentor-release-editor.tsx","utf8");
    expect(client).toContain('projectMutation(url,"DELETE",{expectedUpdatedAt:new Date(release.updatedAt).toISOString()})');
  });
});
