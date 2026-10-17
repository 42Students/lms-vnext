import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabaseConnection } from "@/db/client";
import { createLessonContent, transitionLessonContent, updateLessonContent } from "@/modules/courses/lesson-content-service";
import { createCourseLesson, updateCourseLesson, archiveCourseLesson } from "@/modules/courses/lesson-service";
import { issueVideoUploadGrant } from "@/modules/courses/lesson-video-service";
import { listSuperAdminContentDirectory } from "@/modules/courses/super-admin-content-directory-service";
import { listSuperAdminContentAuthoringLessons } from "@/modules/courses/super-admin-content-authoring-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { createCoursesContentFixture, superAdminContext, type CoursesContentFixture } from "../support/sa-courses-content-fixture";

const enabled = Boolean(process.env.TEST_DATABASE_URL) && process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = enabled ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 }) : null;
const admin = superAdminContext();
let fx: CoursesContentFixture;

describe.skipIf(!enabled)("Super Admin Video, Resources and Live Classes authoring (real PostgreSQL)", () => {
  beforeAll(async () => { fx = await createCoursesContentFixture(pool!, "sa58"); });
  afterAll(async () => {
    try { await fx?.cleanup(); } finally { await pool?.end(); await closeDatabaseConnection(); }
  });

  it("SA-academics-people-58: a Super Admin with no membership authors, edits, publishes and archives YouTube, Resource and Live class content", async () => {
    expect(admin.membership).toBeNull();
    const picker = await listSuperAdminContentAuthoringLessons(admin);
    expect(picker.map((row) => row.id)).toContain(fx.ids.lesson);

    const youtube = await createLessonContent(admin, {
      lessonId: fx.ids.lesson, contentType: "YOUTUBE", title: "Intro video " + fx.tag, points: 0, sequence: 0,
      externalUrl: "https://www.youtube.com/watch?v=abc123", durationSeconds: 300,
    });
    const resource = await createLessonContent(admin, {
      lessonId: fx.ids.lesson, contentType: "RESOURCE", title: "Reading " + fx.tag, points: 0, sequence: 1, notes: "Read chapter one",
    });
    const live = await createLessonContent(admin, {
      lessonId: fx.ids.lesson, contentType: "LIVE_CLASS", title: "Doubt session " + fx.tag, points: 0, sequence: 2,
      externalUrl: "https://meet.example.org/room-1",
      startsAt: "2026-11-01T10:00:00+05:30", endsAt: "2026-11-01T11:00:00+05:30",
    });
    expect([youtube.status, resource.status, live.status]).toEqual(["DRAFT", "DRAFT", "DRAFT"]);

    const updatedYoutube = await updateLessonContent(admin, youtube.id, { title: "Intro video v2 " + fx.tag, externalUrl: "https://youtu.be/xyz789", durationSeconds: 420 });
    expect(updatedYoutube).toMatchObject({ title: "Intro video v2 " + fx.tag, durationSeconds: 420 });
    const updatedResource = await updateLessonContent(admin, resource.id, { notes: "Read chapters one and two" });
    expect(updatedResource.notes).toBe("Read chapters one and two");
    await expect(updateLessonContent(admin, live.id, { endsAt: "2026-11-01T09:00:00+05:30" })).rejects.toBeDefined();
    const updatedLive = await updateLessonContent(admin, live.id, { endsAt: "2026-11-01T12:00:00+05:30" });
    expect(updatedLive.endsAt?.toISOString()).toBe("2026-11-01T06:30:00.000Z");

    expect((await transitionLessonContent(admin, youtube.id, { action: "PUBLISH" })).status).toBe("PUBLISHED");
    expect((await transitionLessonContent(admin, resource.id, { action: "PUBLISH" })).status).toBe("PUBLISHED");

    const videos = await listSuperAdminContentDirectory(admin, "VIDEOS", { q: fx.tag });
    expect(videos.items.map((row) => row.id)).toEqual([youtube.id]);
    expect(videos.items[0]).not.toHaveProperty("externalUrl");
    const live1 = await listSuperAdminContentDirectory(admin, "LIVE_CLASSES", { q: fx.tag });
    expect(live1.items.map((row) => row.id)).toEqual([live.id]);

    expect((await transitionLessonContent(admin, live.id, { action: "ARCHIVE" })).status).toBe("ARCHIVED");
    await expect(updateLessonContent(admin, live.id, { title: "after archive" })).rejects.toBeDefined();
  });

  it("SA-academics-people-58: lessons can be created, edited and archived by a Super Admin without membership", async () => {
    const lesson = await createCourseLesson(admin, { learningPathId: fx.ids.path, name: "Authored by SA " + fx.tag, sequence: 5 });
    expect(lesson.name).toBe("Authored by SA " + fx.tag);
    const renamed = await updateCourseLesson(admin, lesson.id, { name: "Renamed by SA " + fx.tag });
    expect(renamed.name).toBe("Renamed by SA " + fx.tag);
    expect((await archiveCourseLesson(admin, lesson.id)).status).toBe("ARCHIVED");
  });

  it("SA-academics-people-58: authoring is fenced to the selected college and to Super Admin", async () => {
    const otherCollege = superAdminContext(SEED_IDS.collegeB);
    await expect(createLessonContent(otherCollege, {
      lessonId: fx.ids.lesson, contentType: "RESOURCE", title: "Cross college", points: 0, sequence: 9, notes: "x",
    })).rejects.toBeInstanceOf(AuthorizationError);
    const notAdmin = { ...admin, user: { ...admin.user, systemRoles: [] } };
    await expect(createLessonContent(notAdmin, {
      lessonId: fx.ids.lesson, contentType: "RESOURCE", title: "Not admin", points: 0, sequence: 9, notes: "x",
    })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("SA-academics-people-59: a Super Admin without an active membership is refused a private video upload grant (binary upload stays blocked on the storage actor contract)", async () => {
    await expect(issueVideoUploadGrant(admin, fx.ids.lesson, {
      title: "Big video", originalName: "big.mp4", contentType: "video/mp4", sizeBytes: 1024 * 1024, durationSeconds: 60,
    })).rejects.toMatchObject({ code: "STORAGE_UPLOADER_MEMBERSHIP_REQUIRED" });
  });
});
