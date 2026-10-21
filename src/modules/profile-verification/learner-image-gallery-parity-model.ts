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
 if(existing)return {kind:"EXISTS" as const,id:existing.id};
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
