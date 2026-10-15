import {z} from "zod";
export const platformBroadcastSchema=z.strictObject({
 title:z.string().trim().min(1).max(255),
 message:z.string().trim().min(1).max(10000),
 link:z.url().refine(value=>new URL(value).protocol==="https:"),
 pinned:z.boolean().default(false),
 showUntil:z.iso.datetime({offset:true}),
 collegeIds:z.array(z.uuid()).max(500),
});
export function platformBroadcastAudience(collegeIds:readonly string[]) {
 return collegeIds.length===0?{mode:"ALL_COLLEGES" as const,collegeIds:[] as string[]}:
 {mode:"SELECTED_COLLEGES" as const,collegeIds:[...new Set(collegeIds)]};
}
