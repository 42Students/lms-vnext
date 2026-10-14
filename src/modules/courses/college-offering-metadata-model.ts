import {z} from "zod";
export const collegeOfferingMetadataSchema=z.strictObject({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  type:z.enum(["CORE","ELECTIVE"]),
  credits:z.number().int().min(1).max(30).nullable(),
  displayOrder:z.number().int().min(0).max(10000),
  confirm:z.literal(true),
});
export function offeringMetadataChangeAffectsDelivery(
  old:{type:string;credits:number|null},
  next:{type:string;credits:number|null},
){return old.type!==next.type || old.credits!==next.credits;}
