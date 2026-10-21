/** Where a recruiter goes when they press a task's button on Today. Shared by Today, notifications and search. */
// Requests live in the drive's Discussion tab now (UX audit, 19 Oct 2026).
const TAB_ALIASES = { interviews: "rounds", interview: "rounds", results: "rounds", selections: "offers", requests: "messages" };

export const driveHref = (jobId, tab) => `/recruiter/drives/${jobId}${tab ? `?tab=${TAB_ALIASES[tab] || tab}` : ""}`;

export function recruiterTaskHref(task) {
  if (!task) return "/recruiter/home";
  // Nothing is ever sent back (N14): what the placement cell asks for is answered on the drive's Requests tab.
  if (task.id && (String(task.id).startsWith("sentback-") || String(task.id).startsWith("changes-"))) return driveHref(task.jobId, "requests");
  if (task.id && String(task.id).startsWith("review-")) return `${driveHref(task.jobId, "applicants")}&review=1`;
  if (task.tab === "messages" && !task.jobId) return "/recruiter/messages";
  if (task.jobId) return driveHref(task.jobId, task.tab);
  if (task.tab === "offers") return "/recruiter/drives";
  return "/recruiter/home";
}

/** The server refused because this recruiter's access to the college ended, was removed, or the account was stopped. */
export const accessEnded = (e) => e?.response?.status === 403 && /No access to this college|account is not active/i.test(String(e?.response?.data?.message || e?.response?.data?.error || ""));
export const ACCESS_ENDED_TEXT = "Your access to this college has ended or was removed. Ask the placement cell to give it again.";

/**
 * Drive status in the recruiter's words (N9): Sent for review, Live, Completed, Cancelled (a declined request is cancelled,
 * with the reason). Draft is a request the recruiter has not sent yet, kept on their own device.
 */
export const DRIVE_STATUS = {
  REQUEST: { label: "Sent for review", status: "pending", color: "gold", group: "waiting" },
  SENT_BACK: { label: "Sent for review", status: "pending", color: "gold", group: "waiting" },
  DRAFT: { label: "Sent for review", status: "pending", color: "gold", group: "waiting" },
  PUBLISHED: { label: "Live", status: "active", color: "green", group: "live" },
  CLOSED: { label: "Completed", status: "closed", color: "default", group: "closed" },
  CANCELLED: { label: "Cancelled", status: "closed", color: "default", group: "closed" },
  REJECTED: { label: "Cancelled", status: "failed", color: "default", group: "closed" },
};

export const driveStatus = (lifecycle) =>
  DRIVE_STATUS[lifecycle] || {
    label: lifecycle || "Drive",
    status: "closed",
    color: "default",
    group: "live",
  };

/** Steps of a drive, and which one it is on. Pure, so the strip and the "Next" button always agree. */
// The last step is "Completed", the drive status the Drives list shows ("Joining" said nothing; UX audit, 19 Oct 2026).
export const DRIVE_STEPS = ["Requested", "Approved", "Applications", "Rounds", "Offers", "Completed"];

export function driveProgress(drive, rounds = []) {
  const lifecycle = drive?.lifecycle;
  if (lifecycle === "REQUEST" || lifecycle === "SENT_BACK" || lifecycle === "REJECTED") return 0;
  if (lifecycle === "DRAFT") return 1;
  if (lifecycle === "CLOSED") return 5;
  if ((drive?.offers || 0) > 0) return 4;
  const started = rounds.some((r) => r.status && r.status !== "PENDING");
  if (started) return 3;
  return 2;
}

/** The one thing to do next on a drive, or null when it is simply waiting on someone else. */
export function driveNextAction(drive, rounds = [], applicantCount = 0) {
  const lifecycle = drive?.lifecycle;
  if (lifecycle === "DRAFT" && Number(drive?.reviewInvited) === 1 && !(drive?.openRequests > 0)) {
    return { label: "Ask for a change", detail: "The placement cell posted this drive and asks you to check it before it goes live. If it is right, there is nothing to do.", kind: "requests" };
  }
  if ((drive?.openRequests || 0) > 0) return { label: "Answer", detail: `The placement cell asked about ${drive.openRequests === 1 ? "1 thing" : `${drive.openRequests} things`}`, kind: "requests" };
  if (lifecycle === "REQUEST" || lifecycle === "SENT_BACK") return { label: null, detail: "The placement cell reviews it and sets the dates", kind: "wait" };
  if (lifecycle === "REJECTED") return { label: "Hire again with changes", detail: drive?.declinedReason ? `Declined: ${drive.declinedReason}` : "The placement cell declined this request", kind: "again" };
  if (lifecycle === "CANCELLED") return { label: "Hire again with changes", detail: "This drive was cancelled", kind: "again" };
  if (lifecycle === "CLOSED") return { label: "Hire again", detail: "This drive is completed", kind: "again" };
  if (lifecycle === "DRAFT") return { label: null, detail: "The placement cell is setting the dates and opens it to students", kind: "wait" };
  if (!drive?.liveShares && (drive?.applicants || 0) > 0) return { label: null, detail: "Students have applied. The placement cell shares the list with you next", kind: "wait" };
  // New applicants without the recruiter's decision: the number Today shows, so Today, Drives and the drive agree (UX audit,
  // 19 Oct 2026; the drive said "17 shared with you" while Today said 5 and Drives said nothing needs you).
  const toReview = drive?.toReview != null ? Number(drive.toReview) : applicantCount;
  if (toReview > 0) return { label: "Review applicants", detail: `${toReview} new ${toReview === 1 ? "applicant" : "applicants"} to review`, kind: "review" };
  const needSlots = rounds.find((r) => r.kind === "INTERVIEW" && r.status !== "COMPLETED" && !r.slotsProposed);
  if (needSlots) return { label: "Add interview slots", detail: needSlots.name, kind: "slots" };
  return { label: null, detail: "Nothing needs you on this drive right now", kind: "wait" };
}
