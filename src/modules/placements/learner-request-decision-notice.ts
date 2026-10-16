/** TPO-requests-verification-04: student-facing, legacy placement-request decision notice. */
export function learnerPlacementRequestDecisionNotice(
  action: "APPROVE" | "REJECT",
  reason: string | null | undefined,
) {
  const status = action === "APPROVE" ? "approved" : "rejected";
  // The delivery boundary accepts 2,000 characters total, including status copy.
  const detail = reason?.trim().slice(0, 1900);
  return {
    title: "Your request was answered",
    body: "Your request was " + status + "." + (detail ? " " + detail : ""),
    actionHref: "/learn/my-placements/support",
  };
}
