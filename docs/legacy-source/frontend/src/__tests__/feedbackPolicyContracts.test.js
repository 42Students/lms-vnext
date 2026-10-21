import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 9 feedback contracts", () => {
  test("admin applications use persistent inline load errors without duplicate toasts", () => {
    const source = read("src/pages/superadmin/sections/JobApplications.js");

    expect(source).toContain('setFetchError(msg || "Failed to load job and applications. Please try again.")');
    expect(source).toContain('message={hasCurrentApplications ? "Couldn\'t refresh applications" : "Failed to load data"}');
    expect(source).not.toContain('message.error(msg || "Failed to load job and applications")');
  });

  test("interview status failures keep their retryable inline error without a second toast", () => {
    const source = read("src/pages/superadmin/sections/JobApplications.js");

    expect(source).toContain("setInterviewActionError({ kind, interviewId, interviewRecord, message: detail })");
    expect(source).toContain('interviewActionError.kind === "completed" ? "Interview was not marked completed"');
    expect(source).toContain("runInterviewStatusAction(");
    expect(source).not.toContain("message.error(detail)");
  });

  test("notes and offer-letter modal failures stay next to the editor", () => {
    const source = read("src/pages/superadmin/sections/JobApplications.js");

    expect(source).toContain('message="Notes were not saved"');
    expect(source).toContain('message="Offer letter was not attached"');
    expect(source).not.toMatch(/setNotesSaveError\(errorMessage\);\s*message\.error\(errorMessage\)/);
    expect(source).not.toMatch(/setOfferLetterSaveError\(errorMessage\);\s*message\.error\(errorMessage\)/);
  });

  test("interview scheduling validation and save failures do not duplicate field or inline errors as toasts", () => {
    const source = read("src/pages/superadmin/sections/InterviewForm.js");

    expect(source).toContain('form.setFields([{ name: "time", errors: ["The selected date and time is in the past"] }])');
    expect(source).toContain('form.setFields([{ name: "location", errors: ["Please enter a valid meeting link starting with https://"] }])');
    expect(source).toContain('message="Interview was not scheduled"');
    expect(source).not.toContain('message.warning("The selected date and time is in the past');
    expect(source).not.toContain('message.warning("Please enter a valid meeting link starting with https://');
    expect(source).not.toContain("if (!fieldError) message.error(errorMessage)");
  });

  test("interview editing keeps validation and server failures inline", () => {
    const source = read("src/pages/superadmin/sections/InterviewEditForm.js");

    expect(source).toContain('message="Interview changes were not saved"');
    expect(source).toContain('setSaveError("Organization context missing. Please reload the page and try again.")');
    expect(source).not.toContain('message.warning("The selected date and time is in the past');
    expect(source).not.toContain('message.warning("Please enter a valid meeting link starting with https://');
    expect(source).not.toContain("if (!fieldError) message.error(errorMessage)");
  });

  test("interview feedback failure uses its inline retry state without a duplicate toast", () => {
    const source = read("src/pages/superadmin/sections/InterviewFeedbackForm.js");

    expect(source).toContain('message="Feedback was not submitted"');
    expect(source).toContain('action={<Button size="small" onClick={() => form.submit()} disabled={loading}>Retry</Button>}');
    expect(source).not.toMatch(/setSubmitError\(errorMessage\);\s*message\.error\(errorMessage\)/);
  });

  test("drive create/edit save failures stay visible in the form instead of toast-only", () => {
    const source = read("src/pages/superadmin/sections/JobForm.js");

    expect(source).toContain('const [saveError, setSaveError] = useState(null)');
    expect(source).toContain('message={job ? "Drive changes were not saved" : "Drive was not created"}');
    expect(source).toContain('description={saveError}');
    expect(source).not.toContain('message.error(response?.data?.message || `Failed to ${job ? "update" : "create"} job`)');
    expect(source).not.toContain('message.error(msg)');
  });

  test("background notification refreshes use inline/live status instead of toast spam", () => {
    const learnerFeed = read("src/hooks/useNotificationFeed.js");
    const learnerBell = read("src/components/Dropdowns/Notification/NotifivationDropdown.js");
    const recruiterBell = read("src/components/recruiter/RecruiterNotificationBell.jsx");
    const tpoBell = read("src/components/tpo/TpoBellPanel.jsx");

    expect(learnerFeed).not.toContain("message.");
    expect(learnerBell).toContain("RefreshStatus");
    expect(learnerBell).toContain("PanelPartial");
    expect(recruiterBell).toContain("RefreshStatus");
    expect(recruiterBell).toContain("PanelPartial");
    expect(tpoBell).toContain("RefreshStatus");
    expect(tpoBell).toContain("PanelPartial");
  });

  test("network feedback uses persistent severity rather than transient toasts", () => {
    const source = read("src/components/Common/NetworkStatusBanner.jsx");
    expect(source).toContain('type={offline ? "error" : "success"}');
    expect(source).toContain('role={offline ? "alert" : "status"}');
    expect(source).toContain("Your current screen is being kept");
    expect(source).not.toContain("message.");
  });

  test("successful admin creation feedback gives a useful next step", () => {
    const expectations = [
      ["src/pages/superadmin/sections/Departments.js", "Next, add programs or courses"],
      ["src/pages/superadmin/sections/Programs.js", "Next, create its semesters and batches"],
      ["src/pages/superadmin/sections/Courses.js", "Next, add lessons and map it to the right semester"],
      ["src/pages/superadmin/sections/Batches.js", "Next, create its classes/sections"],
      ["src/pages/superadmin/sections/Classes.js", "Next, register or move students"],
      ["src/pages/superadmin/sections/SemesterManagement.js", "Next, map its courses and assign faculty"],
      ["src/pages/superadmin/sections/LessonContent.js", "Add another item or review it in Existing Content"],
    ];

    expectations.forEach(([file, phrase]) => {
      expect(read(file)).toContain(phrase);
    });
  });

  test("refresh components preserve last-good data and expose stale/retry feedback", () => {
    const jobs = read("src/pages/superadmin/sections/Jobs.js");
    const applications = read("src/pages/superadmin/sections/JobApplications.js");
    const notifications = read("src/components/Notifications/NotificationsContent.jsx");

    expect(jobs).toContain("jobsRefreshing");
    expect(jobs).toContain("Showing the last drives loaded for these filters.");
    expect(applications).toContain("applicationsRefreshing");
    expect(applications).toContain("Couldn't refresh applications");
    expect(notifications).toContain("Showing the last notifications we loaded.");
  });
});
