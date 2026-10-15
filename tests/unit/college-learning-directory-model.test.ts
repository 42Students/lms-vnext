import { describe, expect, it } from "vitest";
import {collegeProgressCsvHref} from "@/modules/courses/college-progress-export-model";
import { lessonsCsvHref } from "@/modules/courses/college-lessons-export-model";
import {
  collegeLearningHref,
  collegeLearningPageCount,
  collegeLearningQuerySchema,
  collegeLessonQuerySchema,
  collegeProgressQuerySchema,
  collegeProgressDescription,
} from "@/modules/courses/college-learning-directory-model";

describe("College Admin lessons and course progress pure models", () => {
  it("defaults to active rows and strict college-independent query boundaries", () => {
    expect(collegeLearningQuerySchema.parse({}))
      .toEqual({ q: "", status: "ACTIVE", page: 1 });
    expect(collegeLearningQuerySchema.parse({
      q: "  sample  ", status: "ARCHIVED", page: "3",
    })).toEqual({ q: "sample", status: "ARCHIVED", page: 3 });
    for (const invalid of [
      { collegeId: "foreign" },
      { page: -1 },
      { page: 1001 },
      { status: "PUBLISHED" },
      { offeringStatus: "SUSPENDED" },
      { q: "x".repeat(101) },
    ]) {
      expect(collegeLearningQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("generates only fixed role-safe routes with escaped search", () => {
    const query = {
      q: "a & b", status: "ALL" as const, page: 2,
    };
    const lessons = new URL(collegeLearningHref("LESSONS", query), "https://example.test");
    const progress = new URL(collegeLearningHref("PROGRESS", query), "https://example.test");
    expect(lessons.pathname).toBe("/college/lessons");
    expect(progress.pathname).toBe("/college/course-progress");
    expect(progress.searchParams.get("q")).toBe("a & b");
    expect(collegeProgressQuerySchema.safeParse({courseCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({programCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({cohortCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({departmentName:"x".repeat(256)}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({activityState:"INFERRED"}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({completionEvidence:"PASS_RATE"}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({learningPathPresence:"GUESSED"}).success).toBe(false);
    expect(collegeProgressQuerySchema.safeParse({publishedPathPresence:"LEARNER_VISIBLE"}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({publishedPathPresence:"NO_PUBLISHED_PATH"}))).toContain("publishedPathPresence=NO_PUBLISHED_PATH");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({learningPathPresence:"NO_PATH"}))).toContain("learningPathPresence=NO_PATH");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({completionEvidence:"COMPLETED_CONTENT"}))).toContain("completionEvidence=COMPLETED_CONTENT");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({activityState:"UNRECORDED"}))).toContain("activityState=UNRECORDED");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({departmentName:"CS & EE"}))).toContain("departmentName=CS+%26+EE");
    expect(collegeProgressQuerySchema.safeParse({offeringType:"LAB"}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({offeringType:"ELECTIVE"}))).toContain("offeringType=");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({cohortCode:"B-2026"})))
      .toContain("cohortCode=B-2026");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({periodCode:"2026-FALL"})))
      .toContain("periodCode=2026-FALL");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({programCode:"CS & EE"})))
      .toContain("programCode=CS+%26+EE");
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({courseCode:"CS 101"})))
      .toContain("courseCode=CS+101");
    const lifecycle = collegeLessonQuerySchema.parse({ offeringStatus: "ARCHIVED" });
    expect(collegeLearningHref("LESSONS", lifecycle)).toContain("offeringStatus=ARCHIVED");
    expect(collegeLessonQuerySchema.safeParse({ offeringStatus: "SUSPENDED" }).success).toBe(false);
    expect(collegeLessonQuerySchema.parse({pathStatus:"PUBLISHED"}).pathStatus).toBe("PUBLISHED");
    expect(collegeLessonQuerySchema.safeParse({ pathStatus: "ACTIVE" }).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({publishedContent:"INFERRED"}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({flaggedVisibility:"LEARNER_VISIBLE"}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({assignmentPresence:"SUBMITTED"}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({quizPresence:"TAKEN"}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({quizPresence:"NO_QUIZZES"}))).toContain("quizPresence=NO_QUIZZES");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({assignmentPresence:"NO_ASSIGNMENTS"}))).toContain("assignmentPresence=NO_ASSIGNMENTS");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({flaggedVisibility:"HAS_FLAGGED"}))).toContain("flaggedVisibility=HAS_FLAGGED");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({publishedContent:"NONE_PUBLISHED"}))).toContain("publishedContent=NONE_PUBLISHED");
    expect(collegeLessonQuerySchema.safeParse({offeringType:"LAB"}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({departmentName:"x".repeat(256)}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({contentPresence:"PUBLISHED"}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({contentPresence:"EMPTY"}))).toContain("contentPresence=EMPTY");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({departmentName:"CS&IT"}))).toContain("departmentName=CS%26IT");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({offeringType:"ELECTIVE"}))).toContain("offeringType=ELECTIVE");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({pathStatus:"ARCHIVED"})))
      .toContain("pathStatus=ARCHIVED");
    expect(collegeLessonQuerySchema.safeParse({ courseCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({ programCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({ cohortCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({cohortCode:"B&1"}))).toContain("cohortCode=B%261");
    expect(collegeLessonQuerySchema.safeParse({ periodCode: "x".repeat(65) }).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({periodCode:"2026-FALL"})))
      .toContain("periodCode=2026-FALL");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({programCode:"PROG & CS"})))
      .toContain("programCode=PROG+%26+CS");
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({courseCode:"CS 101"})))
      .toContain("courseCode=CS+101");
    expect(progress.searchParams.has("collegeId")).toBe(false);
    expect(collegeLearningHref("LESSONS", {
      q: "", status: "ACTIVE", page: 1,
    })).toBe("/college/lessons");
  });

  it("distinguishes recorded activity from eligible-learner completion", () => {
    expect(collegeProgressDescription({
      recordedRows: 0, completedRows: 0, learnersWithRecords: 0,
    })).toBe("No recorded learner content activity");
    expect(collegeProgressDescription({
      recordedRows: 5, completedRows: 3, learnersWithRecords: 2,
    })).toBe("3 completed content records of 5; 2 distinct learners with records");
    expect(collegeLearningPageCount(0)).toBe(1);
    expect(collegeLearningPageCount(26)).toBe(2);
  });
  it("lessons programStatus persists across validated page links",()=>{
    expect(collegeLessonQuerySchema.safeParse({programStatus:"INVALID"}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({programStatus:"ACTIVE",page:2}))).toContain("programStatus=ACTIVE");
  });

  it("lessons cohortStatus persists across validated page links",()=>{
    expect(collegeLessonQuerySchema.safeParse({cohortStatus:"INVALID"}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({cohortStatus:"PLANNED",page:2}))).toContain("cohortStatus=PLANNED");
  });

  it("lessons periodStatus respects database lifecycle enums and URL state",()=>{
    expect(collegeLessonQuerySchema.safeParse({periodStatus:"INVALID"}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({periodStatus:"PLANNED"}))).toContain("periodStatus=PLANNED");
  });

  it("lessons courseStatus respects database lifecycle enums and URL state",()=>{
    expect(collegeLessonQuerySchema.safeParse({courseStatus:"INVALID"}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({courseStatus:"ACTIVE"}))).toContain("courseStatus=ACTIVE");
  });

  it("lessons departmentCode is exact, bounded and escaped",()=>{
    expect(collegeLessonQuerySchema.safeParse({departmentCode:"a".repeat(65)}).success).toBe(false);
    expect(collegeLearningHref("LESSONS",collegeLessonQuerySchema.parse({departmentCode:"CS & EE"}))).toContain("departmentCode=CS+%26+EE");
  });

  it("course progress programStatus maintains valid scoped query state",()=>{
    expect(collegeProgressQuerySchema.safeParse({programStatus:"BAD"}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({programStatus:"ACTIVE"}))).toContain("programStatus=ACTIVE");
  });

  it("course progress cohortStatus maintains valid scoped query state",()=>{
    expect(collegeProgressQuerySchema.safeParse({cohortStatus:"BAD"}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({cohortStatus:"PLANNED"}))).toContain("cohortStatus=PLANNED");
  });

  it("course progress periodStatus validates parent lifecycle and URL filtering",()=>{
    expect(collegeProgressQuerySchema.safeParse({periodStatus:"BAD"}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({periodStatus:"PLANNED"}))).toContain("periodStatus=PLANNED");
  });

  it("course progress courseStatus validates parent lifecycle and URL filtering",()=>{
    expect(collegeProgressQuerySchema.safeParse({courseStatus:"BAD"}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({courseStatus:"ACTIVE"}))).toContain("courseStatus=ACTIVE");
  });

  it("progress departmentCode is bounded and escapes exact-code links",()=>{
    expect(collegeProgressQuerySchema.safeParse({departmentCode:"x".repeat(65)}).success).toBe(false);
    expect(collegeLearningHref("PROGRESS",collegeProgressQuerySchema.parse({departmentCode:"C & S"}))).toContain("departmentCode=C+%26+S");
  });

  it("shared parent filters serialize exactly once for lessons and progress", () => {
    for (const kind of ["LESSONS","PROGRESS"] as const) {
      const schema = kind === "LESSONS" ? collegeLessonQuerySchema : collegeProgressQuerySchema;
      const href = collegeLearningHref(kind, schema.parse({
        programStatus:"ACTIVE",cohortStatus:"PLANNED",periodStatus:"ACTIVE",
        courseStatus:"ARCHIVED",departmentCode:"CS & EE",
      }));
      const params = new URL(href,"https://college.test").searchParams;
      for (const key of ["programStatus","cohortStatus","periodStatus","courseStatus","departmentCode"])
        expect(params.getAll(key)).toHaveLength(1);
    }
  });

  it("filters college lessons by contentType without silently accepting an unknown value", () => {
    expect(collegeLessonQuerySchema.safeParse({contentType:"AUDIO"}).success).toBe(false);
    const query=collegeLessonQuerySchema.parse({contentType:"YOUTUBE"});
    expect(new URL(collegeLearningHref("LESSONS",query),"https://test.example").searchParams.get("contentType")).toBe("YOUTUBE");
    expect(new URL(lessonsCsvHref(query),"https://test.example").searchParams.get("contentType")).toBe("YOUTUBE");
  });

  it("validates persisted contentLifecycle for lesson pages and CSV", () => {
    expect(collegeLessonQuerySchema.safeParse({contentLifecycle:"UNKNOWN"}).success).toBe(false);
    const query=collegeLessonQuerySchema.parse({contentLifecycle:"PUBLISHED"});
    expect(new URL(collegeLearningHref("LESSONS",query),"https://t.example").searchParams.get("contentLifecycle")).toBe("PUBLISHED");
    expect(new URL(lessonsCsvHref(query),"https://t.example").searchParams.get("contentLifecycle")).toBe("PUBLISHED");
  });

  it("validates one-based lesson sequence lower bound on page and CSV", () => {
    expect(collegeLessonQuerySchema.safeParse({sequenceFrom:0}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({sequenceFrom:10001}).success).toBe(false);
    const q=collegeLessonQuerySchema.parse({sequenceFrom:"2"});
    expect(new URL(collegeLearningHref("LESSONS",q),"https://t.example").searchParams.get("sequenceFrom")).toBe("2");
    expect(new URL(lessonsCsvHref(q),"https://t.example").searchParams.get("sequenceFrom")).toBe("2");
  });

  it("validates one-based lesson order upper bound on page and CSV", () => {
    expect(collegeLessonQuerySchema.safeParse({sequenceThrough:0}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({sequenceThrough:10001}).success).toBe(false);
    const q=collegeLessonQuerySchema.parse({sequenceThrough:"1"});
    expect(new URL(collegeLearningHref("LESSONS",q),"https://t.example").searchParams.get("sequenceThrough")).toBe("1");
    expect(new URL(lessonsCsvHref(q),"https://t.example").searchParams.get("sequenceThrough")).toBe("1");
  });

  it("round-trips bounded exact lesson title through page and CSV", () => {
    expect(collegeLessonQuerySchema.safeParse({lessonName:"x".repeat(256)}).success).toBe(false);
    expect(collegeLessonQuerySchema.safeParse({lessonName:" "}).success).toBe(false);
    const q=collegeLessonQuerySchema.parse({lessonName:"  Intro & Set-up "});
    expect(q.lessonName).toBe("Intro & Set-up");
    expect(new URL(collegeLearningHref("LESSONS",q),"https://t.example").searchParams.get("lessonName")).toBe("Intro & Set-up");
    expect(new URL(lessonsCsvHref(q),"https://t.example").searchParams.get("lessonName")).toBe("Intro & Set-up");
  });

  it("accepts only saved-lesson presence values and retains CSV selector",()=>{
    expect(collegeProgressQuerySchema.safeParse({lessonPresence:"INFERRED"}).success).toBe(false);
    const q=collegeProgressQuerySchema.parse({lessonPresence:"HAS_LESSONS"});
    expect(collegeLearningHref("PROGRESS",q)).toContain("lessonPresence=HAS_LESSONS");
    expect(collegeProgressCsvHref(q)).toContain("lessonPresence=HAS_LESSONS");
  });

  it("retains scoped authored-assignment selector in progress and CSV",()=>{
    expect(collegeProgressQuerySchema.safeParse({assignmentPresence:"SUBMITTED"}).success).toBe(false);
    const q=collegeProgressQuerySchema.parse({assignmentPresence:"NO_ASSIGNMENTS"});
    expect(collegeLearningHref("PROGRESS",q)).toContain("assignmentPresence=NO_ASSIGNMENTS");
    expect(collegeProgressCsvHref(q)).toContain("assignmentPresence=NO_ASSIGNMENTS");
  });

  it("persists authored quiz triage across progress navigation and CSV",()=>{
    expect(collegeProgressQuerySchema.safeParse({quizPresence:"ATTEMPTED"}).success).toBe(false);
    const q=collegeProgressQuerySchema.parse({quizPresence:"NO_QUIZZES"});
    expect(collegeLearningHref("PROGRESS",q)).toContain("quizPresence=NO_QUIZZES");
    expect(collegeProgressCsvHref(q)).toContain("quizPresence=NO_QUIZZES");
  });

  it("keeps persisted resource triage in progress page and export",()=>{
    expect(collegeProgressQuerySchema.safeParse({resourcePresence:"DOWNLOADED"}).success).toBe(false);
    const q=collegeProgressQuerySchema.parse({resourcePresence:"NO_RESOURCES"});
    expect(collegeLearningHref("PROGRESS",q)).toContain("resourcePresence=NO_RESOURCES");
    expect(collegeProgressCsvHref(q)).toContain("resourcePresence=NO_RESOURCES");
  });

  it("validates saved live class selector on progress and CSV",()=>{
    expect(collegeProgressQuerySchema.safeParse({liveClassPresence:"ATTENDED"}).success).toBe(false);
    const q=collegeProgressQuerySchema.parse({liveClassPresence:"NO_LIVE"});
    expect(collegeLearningHref("PROGRESS",q)).toContain("liveClassPresence=NO_LIVE");
    expect(collegeProgressCsvHref(q)).toContain("liveClassPresence=NO_LIVE");
  });

  it("preserves actual shared versus section lesson-content audience in CSV",()=>{
    expect(collegeLessonQuerySchema.safeParse({contentAudience:"LEARNER"}).success).toBe(false);
    const q=collegeLessonQuerySchema.parse({contentAudience:"SECTION"});
    expect(collegeLearningHref("LESSONS",q)).toContain("contentAudience=SECTION");
    expect(lessonsCsvHref(q)).toContain("contentAudience=SECTION");
  });

});
