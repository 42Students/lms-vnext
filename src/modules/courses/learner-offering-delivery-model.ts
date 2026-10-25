export type LearnerOfferingDeliveryResolution =
  | { kind: "selected"; deliveryId: unknown }
  | { kind: "choose"; options: { deliveryId: string; courseName: string }[] }
  | { kind: "none" };

/**
 * An assignment or quiz link without ?deliveryId= resolves only against rows the learner is
 * already authorized for: exactly one delivery picks it, several ask the learner to choose.
 * An explicit deliveryId is passed through untouched for the strict detail selectors to validate.
 */
export function resolveLearnerOfferingDelivery(
  authorizedRows: readonly { id: string; deliveryId: string; courseName: string }[],
  offeringId: string,
  rawDeliveryId: unknown,
): LearnerOfferingDeliveryResolution {
  if (rawDeliveryId !== undefined && rawDeliveryId !== "") {
    return { kind: "selected", deliveryId: rawDeliveryId };
  }
  const seen = new Set<string>();
  const options = authorizedRows
    .filter(row => row.id === offeringId)
    .filter(row => (seen.has(row.deliveryId) ? false : (seen.add(row.deliveryId), true)))
    .map(row => ({ deliveryId: row.deliveryId, courseName: row.courseName }));
  if (options.length === 0) return { kind: "none" };
  // A learner may have several valid deliveries for one offering. Selecting
  // the first entry leaks the wrong class context into downstream actions.
  if (options.length === 1) return { kind: "selected", deliveryId: options[0]!.deliveryId };
  return { kind: "choose", options };
}
