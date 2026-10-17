import {z} from "zod";

/** TPO-drive-workspace-06 / R06: never delete history or applicants. */
export const tpoDeleteDraftSchema=z.object({
 confirmed:z.literal(true),expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();
export function canDeleteUnpublishedDrive(input:{
 status:string;applications:number;offers:number;matchesVersion:boolean
}):"ALLOW"|"NOT_DRAFT"|"HAS_HISTORY"|"STALE"{
 if(input.status!=="DRAFT")return "NOT_DRAFT";
 if(input.applications>0||input.offers>0)return "HAS_HISTORY";
 return input.matchesVersion?"ALLOW":"STALE";
}
