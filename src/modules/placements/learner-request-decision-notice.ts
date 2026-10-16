/** TPO-requests-verification-04: student-facing, legacy placement-request decision notice. */
export function learnerPlacementRequestDecisionNotice(
  action: "APPROVE" | "REJECT",
  reason: string | null | undefined,
) {
  const status = action === "APPROVE" ? "approved" : "rejected";
  const detail = reason?.trim();
  return {
    title: "Your request was answered",
    body: "Your request was " + status + "." + (detail ? " " + detail : ""),
    actionHref: "/learn/my-placements/support",
  };
}
