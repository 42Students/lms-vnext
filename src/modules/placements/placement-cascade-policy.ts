/**
 * P-S1-06: correlation token for one atomic acceptance cascade. The same id
 * appears in the accepted offer and all automatically changed siblings.
 */
export function parsePlacementCascadeId(reason: string | null | undefined): string | null {
  if (!reason) return null;
  const match = /(?:^|;\s*)cascade:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:$|;)/i.exec(reason);
  return match?.[1]?.toLowerCase() ?? null;
}
