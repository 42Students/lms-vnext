/**
 * Legacy student_image values are references for a private import only.
 * Do not render source URLs or S3 keys: access requires an owner-bound
 * profile_private_document_receipts row and a freshly signed read grant.
 */
export type LegacyImageSource = {
  legacyImageId: number;
  sourceUrl?: string | null;
  sourceKey?: string | null;
  originalOrder?: number | null;
  wasDeleted?: boolean | null;
};
export type BoundLegacyImage = {
  legacyImageId: number;
  receiptId: string;
  displayOrder: number;
  isActive: boolean;
};
/** The caller's receipt map must be built from verified, owner-scoped imports. */
export function bindLegacyImagesToPrivateReceipts(
  source: readonly LegacyImageSource[],
  receiptBySourceId: ReadonlyMap<number, string>,
): { images: BoundLegacyImage[]; unresolvedSourceIds: number[] } {
  const images: BoundLegacyImage[] = [];
  const unresolvedSourceIds: number[] = [];
  const seen = new Set<number>();
  for (const image of source) {
    if (!Number.isSafeInteger(image.legacyImageId) || image.legacyImageId < 1 ||
      seen.has(image.legacyImageId)) continue;
    seen.add(image.legacyImageId);
    const receiptId = receiptBySourceId.get(image.legacyImageId);
    if (!receiptId) { unresolvedSourceIds.push(image.legacyImageId); continue; }
    images.push({legacyImageId:image.legacyImageId, receiptId,
      displayOrder: Number.isSafeInteger(image.originalOrder) && (image.originalOrder ?? -1) >= 0
        ? image.originalOrder! : images.length,
      isActive: image.wasDeleted !== true});
  }
  images.sort((a,b)=>a.displayOrder-b.displayOrder||a.legacyImageId-b.legacyImageId);
  return {images, unresolvedSourceIds};
}
