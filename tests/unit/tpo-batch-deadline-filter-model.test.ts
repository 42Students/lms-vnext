import {it,expect} from "vitest";
import {tpoBatchDeadlineFilterSchema,filterTpoBatchDeadline} from "@/modules/placements/tpo-batch-deadline-filter-model";
const now=new Date("2026-10-15T10:00:00.000Z");
const rows=[
 {deadline:new Date("2026-10-15T11:00:00Z"),invitedAt:now,finishedAt:null},
 {deadline:new Date("2026-10-14T11:00:00Z"),invitedAt:now,finishedAt:null},
 {deadline:null,invitedAt:null,finishedAt:null},
 {deadline:new Date("2026-10-16T11:00:00Z"),invitedAt:now,finishedAt:now},
];
it("filters recorded active invitations; never includes finished or fabricated dates",()=>{
 expect(filterTpoBatchDeadline(rows,"NEXT_7_DAYS",now)).toEqual([rows[0]]);
 expect(filterTpoBatchDeadline(rows,"PAST_DUE",now)).toEqual([rows[1]]);
 expect(filterTpoBatchDeadline(rows,"NO_DEADLINE",now)).toEqual([rows[2]]);
 expect(filterTpoBatchDeadline(rows,"ALL",now)).toHaveLength(4);
});
it("validates deadline-filter query",()=>{expect(tpoBatchDeadlineFilterSchema.parse(undefined)).toBe("ALL");expect(tpoBatchDeadlineFilterSchema.safeParse("next").success).toBe(false);});
