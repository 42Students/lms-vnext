import {z} from "zod";
const uuid=z.string().uuid();
export type LearnerImageReference={
 id:string;legacyImageId:number|null;displayOrder:number;
 receiptId:string;isActive:boolean;deactivatedAt:Date|null;
};
/** A gallery append is atomic and capped at ten currently active pictures.
 * Never accept or echo historical public filesystem paths as auth grants.
 */
export const MAX_LEARNER_PROFILE_IMAGES=10;
export const learnerGalleryUploadSchema=z.strictObject({
 receiptId:uuid,displayOrder:z.number().int().min(0).max(10000).optional(),
 idempotencyKey:z.string().uuid(),
});
export function nextGalleryInsert(rows:readonly LearnerImageReference[],receiptId:string){
 const existing=rows.find(row=>row.receiptId===receiptId);
 if(existing){
  // A revoked gallery membership is history, not a publishable active image.
  if(!existing.isActive||existing.deactivatedAt)return {kind:"INACTIVE" as const};
  return {kind:"EXISTS" as const,id:existing.id};
 }
 const active=rows.filter(row=>row.isActive&&!row.deactivatedAt);
 if(active.length>=MAX_LEARNER_PROFILE_IMAGES)return {kind:"LIMIT" as const};
 return {kind:"APPEND" as const,displayOrder:Math.max(-1,...active.map(row=>row.displayOrder))+1};
}
export function orderGallery(rows:readonly LearnerImageReference[]){
 return rows.filter(row=>row.isActive&&!row.deactivatedAt).sort((a,b)=>
  a.displayOrder-b.displayOrder||a.id.localeCompare(b.id));
}
export function galleryIdOrLegacy(raw:string){
 if(uuid.safeParse(raw).success)return {kind:"UUID" as const,id:raw};
 if(/^[0-9]{1,12}$/.test(raw))return {kind:"LEGACY" as const,id:Number(raw)};
 return {kind:"INVALID" as const};
}
export function galleryDeactivateResult(row:LearnerImageReference|null){
 if(!row)return {changed:false,reason:"IMAGE_NOT_FOUND" as const};
 if(!row.isActive||row.deactivatedAt)return {changed:false,reason:"ALREADY_REMOVED" as const};
 return {changed:true,reason:"REMOVED" as const};
}
/** The saved name is an audited pointer, never a direct object URL. */
export function authorizedGalleryItem(row:LearnerImageReference,signedUrl:string|null){
 return {id:row.id,imageId:row.legacyImageId??row.id,
   imageUrl:signedUrl,active:row.isActive,displayOrder:row.displayOrder};
}

/** User-facing confirmation errors must not pretend that permission failures,
 * disabled gallery storage or provider outages are merely an in-progress scan.
 * The receipt-invalid response can cover both pending scans and bad objects,
 * so it deliberately does not promise that retrying will always succeed. */
export function learnerGalleryConfirmationError(status:number,code?:string):string{
 if(status===401||status===403)return "You no longer have permission to upload this photo. Refresh your session.";
 if(status===503)return "Private photo storage is not ready. Please try again later.";
 if(status===409&&code==="GALLERY_LIMIT")return "The gallery already has ten photos. Remove one before adding another.";
 if(status===409&&code==="GALLERY_IMAGE_REMOVED")return "This photo was previously removed. Choose the file and upload it again as a new verified image.";
 if(status===409&&code==="GALLERY_RECEIPT_INVALID")
   return "This photo has not passed private verification. You can retry after scanning finishes, or choose another file.";
 if(status===404)return "The uploaded photo could not be found. Choose the file again.";
 return "Private photo verification is temporarily unavailable. Please try again later.";
}
