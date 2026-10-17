/**
 * FAC-assessments-R04: only shared-offering rows or the actor's assigned
 * delivery may reach an assessment index. A sibling class is never visible.
 */
export function facultyAssessmentVisibleToDelivery(
  item: { deliveryId: string | null },
  authorizedDeliveryId: string,
): boolean {
  return item.deliveryId === null || item.deliveryId === authorizedDeliveryId;
}
