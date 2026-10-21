/** Pure rules behind the recruiter V2 workspace: where tasks recruiter lead, how far a drive is, what is next, and how a review queue is ordered. */
import { driveHref, driveNextAction, driveProgress, driveStatus, recruiterTaskHref } from "@/components/recruiter/recruiterRoutes";
import { KEY_TO_OUTCOME, OUTCOMES, applicantName, draftKey, factsOf, onlyKnownApplicants, reviewQueue, safeHref, tally, toRows } from "@/components/recruiter/recruiterReviewUtils";
import { groupByDay, weekStartOf } from "@/pages/recruiter/calendar";
import { funnelSteps } from "@/pages/recruiter/company";
import { buildDriveForm, hasTypedContent, valuesFromRequest } from "@/pages/recruiter/drives/new";
import { deadlineText } from "@/pages/recruiter/drives/index";
import moment from "moment";

jest.mock("next/router", () => ({ useRouter: () => ({ query: {}, push: jest.fn(), replace: jest.fn() }) }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: () => ({}) }));
jest.mock("@/api/Services/RecruiterService", () => ({}));

describe("task routes", () => {
  test("each kind of task leads to the place where it is done", () => {
    expect(recruiterTaskHref({ id: "sentback-9", jobId: 9, tab: "overview" })).toBe("/recruiter/drives/9?tab=messages");
    expect(recruiterTaskHref({ id: "changes-9", jobId: 9, tab: "requests" })).toBe("/recruiter/drives/9?tab=messages");
    expect(recruiterTaskHref({ id: "review-4", jobId: 4, tab: "applicants" })).toBe("/recruiter/drives/4?tab=applicants&review=1");
    expect(recruiterTaskHref({ id: "slots-2", jobId: 4, tab: "rounds" })).toBe("/recruiter/drives/4?tab=rounds");
    // the workspace has no "interviews" tab: older links and notifications still land on Rounds, not on Overview
    expect(recruiterTaskHref({ id: "slots-2", jobId: 4, tab: "interviews" })).toBe("/recruiter/drives/4?tab=rounds");
    expect(driveHref(4, "selections")).toBe("/recruiter/drives/4?tab=offers");
    expect(recruiterTaskHref({ id: "messages", jobId: null, tab: "messages" })).toBe("/recruiter/messages");
    expect(recruiterTaskHref({ id: "x", jobId: null, tab: "offers" })).toBe("/recruiter/drives");
    expect(recruiterTaskHref(null)).toBe("/recruiter/home");
    expect(driveHref(7)).toBe("/recruiter/drives/7");
  });
});

describe("drive progress and the next action", () => {
  test("a request is at step 0 until the placement cell approves it", () => {
    expect(driveProgress({ lifecycle: "REQUEST" })).toBe(0);
    expect(driveProgress({ lifecycle: "SENT_BACK" })).toBe(0);
    expect(driveProgress({ lifecycle: "DRAFT" })).toBe(1);
  });
  test("a live drive moves from applications to rounds to offers", () => {
    expect(driveProgress({ lifecycle: "PUBLISHED", offers: 0 }, [{ status: "PENDING" }])).toBe(2);
    expect(driveProgress({ lifecycle: "PUBLISHED", offers: 0 }, [{ status: "SCHEDULED" }])).toBe(3);
    expect(driveProgress({ lifecycle: "PUBLISHED", offers: 2 }, [])).toBe(4);
    expect(driveProgress({ lifecycle: "CLOSED" })).toBe(5);
  });
  test("next is one action, or a plain sentence when the drive waits on someone else", () => {
    expect(driveNextAction({ lifecycle: "REQUEST", openRequests: 2 })).toMatchObject({ label: "Answer", kind: "requests" });
    expect(driveNextAction({ lifecycle: "SENT_BACK" }).label).toBeNull();
    expect(driveNextAction({ lifecycle: "REJECTED", declinedReason: "CTC too low" })).toMatchObject({ label: "Hire again with changes", detail: "Declined: CTC too low" });
    expect(driveNextAction({ lifecycle: "REQUEST" }).label).toBeNull();
    expect(driveNextAction({ lifecycle: "CLOSED" }).kind).toBe("again");
    expect(driveNextAction({ lifecycle: "PUBLISHED", applicants: 5, liveShares: 0 }).label).toBeNull();
    expect(driveNextAction({ lifecycle: "PUBLISHED", applicants: 5, liveShares: 1 }, [], 5)).toMatchObject({ label: "Review applicants", kind: "review" });
    expect(driveNextAction({ lifecycle: "PUBLISHED", applicants: 5, liveShares: 1 }, [{ kind: "INTERVIEW", status: "PENDING", slotsProposed: 0, name: "Panel" }], 0)).toMatchObject({ kind: "slots" });
  });
  test("status wording stays recruiter-specific while tone uses the shared lifecycle vocabulary", () => {
    expect(driveStatus("REQUEST")).toMatchObject({ label: "Sent for review", status: "pending" });
    expect(driveStatus("DRAFT")).toMatchObject({ label: "Sent for review" });
    expect(driveStatus("REJECTED")).toMatchObject({ label: "Cancelled" });
    expect(driveStatus("PUBLISHED")).toMatchObject({ label: "Live", status: "active" });
    expect(driveStatus("REJECTED")).toMatchObject({ group: "closed", status: "failed" });
    expect(driveStatus("CLOSED")).toMatchObject({ label: "Completed", status: "closed" });
  });
});

describe("review queue", () => {
  const people = [
    { applicantId: "a1", name: "Asha", stage: "APPLIED" }, { applicantId: "a2", name: "Bala", stage: "APPLIED" },
    { applicantId: "a3", name: "Chitra", stage: "REJECTED" }, { applicantId: "a4", stage: "SHORTLISTED", firstName: "Dev", lastName: "M" },
  ];
  test("people already out are not queued, undecided come first so a review resumes", () => {
    expect(reviewQueue(people, {}).map((a) => a.applicantId)).toEqual(["a1", "a2", "a4"]);
    expect(reviewQueue(people, { a1: "PASS" }).map((a) => a.applicantId)).toEqual(["a2", "a4", "a1"]);
  });
  test("tally and rows reflect the draft, ignoring unknown outcomes", () => {
    const d = { a1: "PASS", a2: "FAIL", a4: "HOLD", a9: "NOPE" };
    expect(tally(d)).toEqual({ PASS: 1, HOLD: 1, FAIL: 1, ABSENT: 0 });
    expect(toRows(d)).toEqual([{ applicantId: "a1", outcome: "PASS" }, { applicantId: "a2", outcome: "FAIL" }, { applicantId: "a4", outcome: "HOLD" }]);
    expect(Object.keys(OUTCOMES)).toEqual(["PASS", "HOLD", "FAIL", "ABSENT"]);
  });
  test("Waitlist is named for what it does, and both W and H choose it", () => {
    expect(OUTCOMES.HOLD.label).toBe("Waitlist");
    expect(KEY_TO_OUTCOME.w).toBe("HOLD");
    expect(KEY_TO_OUTCOME.h).toBe("HOLD");
    expect(Object.values(OUTCOMES).map((o) => o.key)).toEqual(["s", "w", "r", "a"]);
  });
  test("a draft belongs to one recruiter, and people no longer on the drive are dropped from it", () => {
    expect(draftKey(5, 7, "42", 1)).not.toBe(draftKey(6, 7, "42", 1));
    expect(draftKey(undefined, 7, "42", 1)).toContain("unknown");
    expect(onlyKnownApplicants({ a1: "PASS", gone: "FAIL" }, [{ applicantId: "a1" }])).toEqual({ a1: "PASS" });
    expect(onlyKnownApplicants(null, null)).toEqual({});
  });
  test("only plain web addresses are ever rendered as links", () => {
    expect(safeHref("https://github.com/asha")).toBe("https://github.com/asha");
    expect(safeHref("  http://example.com/r.pdf  ")).toBe("http://example.com/r.pdf");
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "//evil.test/x", "/relative", "ftp://x/y", "https://", "", null, undefined, 42, "vbscript:x"]) {
      expect(safeHref(bad)).toBeNull();
    }
  });
  test("only shared columns are shown, and a name falls back sensibly", () => {
    expect(factsOf({ roll: "R1", branch: "CSE", skillMatch: 82, email: null, secret: "x" }).map((f) => f.label)).toEqual(["Roll no.", "Branch", "Skill match"]);
    expect(factsOf({ skillMatch: 82 })[0].value).toBe("82%");
    expect(applicantName(people[3])).toBe("Dev M");
    expect(applicantName({ applicantId: "z" })).toBe("z");
  });
});

describe("calendar, reports and drive list helpers", () => {
  test("a week groups events by day in time order", () => {
    const start = weekStartOf("2026-10-07"); // a Wednesday: the week starts Monday the 5th
    expect(start.format("YYYY-MM-DD")).toBe("2026-10-05");
    const days = groupByDay([
      { id: "b", start: "2026-10-07T15:00:00" }, { id: "a", start: "2026-10-07T09:00:00" }, { id: "c", start: "2026-10-11T10:00:00" }, { id: "out", start: "2026-10-12T10:00:00" },
    ], start);
    expect(days).toHaveLength(7);
    expect(days[2].events.map((e) => e.id)).toEqual(["a", "b"]);
    expect(days[0].events).toEqual([]);
    expect(days[6].events.map((e) => e.id)).toEqual(["c"]);
  });
  test("funnel conversion is from the previous stage and from the start", () => {
    const steps = funnelSteps([{ stage: "APPLIED", count: 100 }, { stage: "SHORTLISTED", count: 40 }, { stage: "HIRED", count: 10 }]);
    expect(steps.map((s) => s.ofAll)).toEqual([100, 40, 10]);
    expect(steps.map((s) => s.fromPrev)).toEqual([null, 40, 25]);
    expect(funnelSteps([])).toEqual([]);
  });
  test("the request form body is the same for create and resend", () => {
    const body = buildDriveForm({ jobTitle: "SDE", ctcLpa: 7, minCgpa: 6.5 });
    expect(body.roleOptions[0]).toMatchObject({ name: "Default", ctcLpa: 7 });
    expect(Object.keys(body.roleOptions[0]).some((k) => k.startsWith("bond"))).toBe(false); // the bond was removed (8 Oct 2026)
    expect(body.eligibility.minCgpa).toBe(6.5);
    expect(valuesFromRequest({ roleTitle: "SDE", ctcLpa: 5, minCgpa: 6, bondMonths: 3, location: "Hyd", description: "d" })).toMatchObject({ jobTitle: "SDE", ctcLpa: 5, location: "Hyd" });
  });
  test("the default On campus is not typing, so an untouched form never becomes a draft", () => {
    expect(hasTypedContent({ driveMode: "ON_CAMPUS" })).toBe(false);
    expect(hasTypedContent({ driveMode: "ON_CAMPUS", jobTitle: "", ctcLpa: null, location: undefined })).toBe(false);
    expect(hasTypedContent({})).toBe(false);
    expect(hasTypedContent(null)).toBe(false);
    expect(hasTypedContent({ driveMode: "ON_CAMPUS", jobTitle: "SDE" })).toBe(true);
    expect(hasTypedContent({ driveMode: "OFF_CAMPUS" })).toBe(true);
    expect(hasTypedContent({ ctcLpa: 0 })).toBe(true);
  });
  test("stages are shown in plain words", () => {
    expect(factsOf({ stage: "SHORTLISTED" })[0].value).toBe("Shortlisted");
    expect(factsOf({ stage: "SOMETHING_NEW" })[0].value).toBe("SOMETHING_NEW");
  });
  test("a drive's deadline reads as closes or closed", () => {
    const now = moment("2026-10-07T12:00:00");
    expect(deadlineText("2026-10-09T12:00:00", now)).toBe("Applications close in 2 days");
    expect(deadlineText("2026-10-06T12:00:00", now)).toBe("Applications closed a day ago");
    expect(deadlineText(null, now)).toBeNull();
  });
});
