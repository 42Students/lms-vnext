export type ApplicationStatusEvent = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  occurredAt: Date;
};

/** Historical rejection uses the PREVIOUS recorded stage, not a guessed
 * current application status. Unknown stages keep neutral copy.
 */
export function learnerApplicationRejectionLabel(priorStage:string|null):string{
 switch(priorStage?.toUpperCase()){
  case "APPLIED":
  case "SUBMITTED":
  case "SHORTLISTED":return "Not shortlisted";
  case "ASSESSMENT":return "Not cleared: Assessment";
  case "INTERVIEW":return "Not cleared: Interview";
  case "WAITLISTED":return "Waitlist ended";
  default:return "Application status updated";
 }
}
export function learnerApplicationHistoryTimeline(
  events: readonly ApplicationStatusEvent[],
) {
  return [...events]
    .sort(
      (a, b) =>
        a.occurredAt.getTime() - b.occurredAt.getTime() ||
        a.id.localeCompare(b.id),
    )
    .map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      occurredAt: event.occurredAt,
      label: event.toStatus === "SUBMITTED"
        ? "Application submitted"
        : event.toStatus === "WITHDRAWN"
          ? "Application withdrawn"
          : event.toStatus === "REJECTED"
            ? learnerApplicationRejectionLabel(event.fromStatus)
            : "Application status updated",
    }));
}

/** Untrusted persisted URLs may never render non-HTTPS, credentialed links. */
export function safeLearnerCompanyWebsite(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl || rawUrl.length > 2048 || /\s/.test(rawUrl)) return null;
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.search ||
      url.hash
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function learnerCompanyPreview(input: {
  companyName: string;
  companyStatus: string;
  websiteUrl: string | null;
  roleTitle: string;
  driveTitle: string;
}) {
  return {
    companyName: input.companyName,
    companyStatus: input.companyStatus,
    websiteUrl: safeLearnerCompanyWebsite(input.websiteUrl),
    roleTitle: input.roleTitle,
    driveTitle: input.driveTitle,
    // The registered company source has no employer biography, employee count
    // or public logo URL; none of those fields may be inferred.
    hasCompanyDescription: false as const,
  };
}
