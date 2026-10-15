import {z} from "zod";
export const recordedOutsideDriveSchema=z.strictObject({
 collegeId:z.string().uuid(),
 companyRelationshipId:z.string().uuid(),
 title:z.string().trim().min(3).max(200),
 occurredAt:z.coerce.date(),
 externalReferenceUrl:z.url().refine(s=>s.startsWith("https://")).optional(),
 notes:z.string().trim().max(1000).optional(),
}).refine(v=>v.occurredAt.getTime()<=Date.now(),{
 message:"External drive occurrence cannot be in the future",
});
export function outsideDriveIsPlatformJob(){return false as const;}
