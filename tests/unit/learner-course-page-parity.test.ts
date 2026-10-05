import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8",
  );
}

describe("learner Course page parity contract", () => {
  it("keeps the exact legacy learner Course tabs and routes", () => {
    const content = read("src/components/courses/learner-course-tabs.tsx");

    expect(content).toContain('{ label: "Overview", path: "home" }');
    expect(content).toContain('{ label: "Learning Path", path: "roadmap" }');
    expect(content).toContain('{ label: "Attendance", path: "attendanceDetail" }');
    expect(content).toContain('{ label: "Discussions", path: "discussions" }');
  });

  it("splits Overview, Learning Path, Attendance and Discussions into distinct implementations", () => {
    const page = read(
      "src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx",
    );

    expect(page).toContain("LearnerCourseOverview");
    expect(page).toContain("LearnerCourseWorkspace");
    expect(page).toContain("LearnerCourseAttendance");
    expect(page).toContain("LearnerCourseDiscussion");
    expect(page).toContain('activeTab === "home"');
    expect(page).toContain('activeTab === "roadmap"');
    expect(page).toContain('activeTab === "attendanceDetail"');
  });

  it("keeps legacy Learning Path filters, lesson expansion and deep-link focus", () => {
    const content = read("src/components/courses/learner-course-workspace.tsx");

    for (const label of [
      "Lectures",
      "Resources",
      "Assessments",
      "Live Sessions",
    ]) {
      expect(content).toContain(label);
    }
    expect(content).toContain("<details");
    expect(content).toContain("focusLessonId");
    expect(content).toContain("focusContentId");
    expect(content).toContain("AssignmentSubmissionControl");
    expect(content).toContain("QuizAttemptControl");
    expect(content).toContain("LearnerYouTubePlayer");
    expect(content).toContain("LearnerVideoPlayer");
    expect(content).toContain("Open resource");
    expect(content).toContain("Download");
    expect(content).toContain("readOnly");
  });

  it("keeps storage-backed Course content behind an authenticated delivery-scoped route", () => {
    const route = read(
      "src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts",
    );
    const player = read(
      "src/components/courses/learner-video-player.tsx",
    );

    expect(route).toContain("getLearnerCourseWorkspace");
    expect(route).toContain("getAdminStorageBucket");
    expect(route).toContain('"Accept-Ranges": "bytes"');
    expect(route).toContain('status: 206');
    expect(route).toContain('download');
    expect(player).toContain("<video");
    expect(player).toContain("positionSeconds");
    expect(player).toContain("readOnly");
  });

  it("keeps Course Attendance learner-only and Discussions interactive", () => {
    const attendance = read(
      "src/components/courses/learner-course-attendance.tsx",
    );
    const discussion = read(
      "src/components/courses/learner-course-discussion.tsx",
    );
    const deleteRoute = read(
      "src/app/api/courses/deliveries/[deliveryId]/discussions/[messageId]/route.ts",
    );

    expect(attendance).not.toContain("onChangeAttendance");
    expect(attendance).toContain("Attendance threshold");
    expect(discussion).toContain('method: "POST"');
    expect(discussion).toContain('method: "DELETE"');
    expect(discussion).toContain("No messages yet");
    expect(deleteRoute).toContain("deleteCourseDiscussionMessage");
    expect(deleteRoute).toContain("listCourseDiscussionMessages");
  });

  it("keeps the old LMS Courses page naming and filter vocabulary", () => {
    const page = read("src/app/(authenticated)/learn/courses/page.tsx");
    const list = read("src/components/courses/learner-course-list.tsx");

    expect(page).toContain('title="Courses"');
    expect(list).toContain("Semester");
    expect(list).toContain("Search courses");
    expect(list).toContain("Regular");
    expect(list).toContain("Electives");
    expect(list).toContain("Past semester");
    expect(list).toContain("Instructor:");
    expect(list).toContain("Show more courses");
    expect(list).toContain("PAGE_SIZE = 48");
    expect(page).toContain("listLearnerCourseInstructors");
    expect(page).toContain("includeHistorical");
  });
});
