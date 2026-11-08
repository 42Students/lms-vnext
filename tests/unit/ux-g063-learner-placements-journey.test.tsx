import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthorizationError } from "@/modules/permissions/policy";
import LearnerPlacementJobsPage from "@/app/(authenticated)/learn/my-placements/jobs/page";
import LearnerJobDetailError from "@/app/(authenticated)/learn/my-placements/jobs/[jobId]/error";
import LearnerNotificationPreferencesError from "@/app/(authenticated)/learn/my-placements/notification-preferences/error";
import LearnerCalendarError from "@/app/(authenticated)/learn/my-placements/calendar/error";
import LearnerInterviewError from "@/app/(authenticated)/learn/my-placements/interviews/error";
import LearnerOffersError from "@/app/(authenticated)/learn/my-placements/offers/error";

const reads = vi.hoisted(() => ({
  context: vi.fn(),
  drives: vi.fn(),
  enrollment: vi.fn(),
  saved: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: reads.context,
}));
vi.mock("@/modules/placements/learner-closing-drives-service", () => ({
  getOwnLearnerDriveBrowse: reads.drives,
}));
vi.mock("@/modules/placements/learner-job-service", () => ({
  getOwnLearnerJobEnrollmentState: reads.enrollment,
  listLearnerPlacementJobs: vi.fn(),
}));
vi.mock("@/modules/placements/saved-job-service", () => ({
  listOwnPlacementSavedJobs: reads.saved,
}));

describe("UX-G063 learner placements journey recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    reads.context.mockResolvedValue({ membership: { id: "fixture-learner" } });
    reads.drives.mockResolvedValue({ rows: [], snapshotNowIso: "2026-11-08T00:00:00.000Z" });
  });

  it("never treats a failed enrollment read as an empty authorized job list", async () => {
    reads.enrollment.mockRejectedValue(new Error("DB_TEMPORARILY_UNAVAILABLE PRIVATE"));
    const html = renderToStaticMarkup(await LearnerPlacementJobsPage());
    expect(html).toContain("Could not verify your placement enrollment");
    expect(html).toContain("Retry checking drives");
    expect(html).not.toContain("No placement drives can be shown yet");
    expect(html).not.toContain("DB_TEMPORARILY_UNAVAILABLE");
    expect(reads.saved).not.toHaveBeenCalled();
  });

  it("distinguishes an actually missing active enrollment from a read failure", async () => {
    reads.enrollment.mockResolvedValue("NO_ACTIVE_ENROLLMENT");
    const html = renderToStaticMarkup(await LearnerPlacementJobsPage());
    expect(html).toContain("No placement drives can be shown yet");
    expect(html).toContain("active program and batch enrollment");
    expect(html).not.toContain("Could not verify your placement enrollment");
  });

  it("does not downgrade revoked learner access into retryable empty data", async () => {
    reads.enrollment.mockRejectedValue(new AuthorizationError("placements.read"));
    await expect(LearnerPlacementJobsPage()).rejects.toBeInstanceOf(AuthorizationError);
    expect(reads.saved).not.toHaveBeenCalled();
  });

  it("job and preference error routes offer large safe exits without leaking diagnostics", () => {
    const privateError = new Error("PRIVATE_ERROR_DO_NOT_DISPLAY");
    const job = renderToStaticMarkup(
      <LearnerJobDetailError error={privateError} reset={() => {}} />,
    );
    expect(job).toContain("Application status unavailable");
    expect(job).toContain("Check status again");
    expect(job).toContain('href="/learn/my-placements/jobs"');
    expect(job).toContain('href="/learn/my-placements/applications"');
    expect(job).toMatch(/min-h-11/);
    const preference = renderToStaticMarkup(
      <LearnerNotificationPreferencesError error={privateError} reset={() => {}} />,
    );
    expect(preference).toContain('href="/learn/my-placements"');
    expect(preference).toContain("Retry");
    expect(preference).not.toContain("PRIVATE_ERROR_DO_NOT_DISPLAY");
    expect(job).not.toContain("PRIVATE_ERROR_DO_NOT_DISPLAY");
  });

  it("calendar, interviews and offers retain truthful failed-read recovery", () => {
    const error = new Error("PRIVATE_ERROR_DO_NOT_DISPLAY");
    const html = [
      renderToStaticMarkup(<LearnerCalendarError error={error} reset={() => {}} />),
      renderToStaticMarkup(<LearnerInterviewError error={error} reset={() => {}} />),
      renderToStaticMarkup(<LearnerOffersError error={error} reset={() => {}} />),
    ].join("\n");
    expect(html).toContain("does not mean you have no events");
    expect(html).toContain("does not mean you have no scheduled interview rounds");
    expect(html).toContain("does not mean there are no offers");
    expect(html).not.toContain("PRIVATE_ERROR_DO_NOT_DISPLAY");
  });
});
