import {it,expect} from "vitest";
import {sortLearnerNotices as sort,learnerNoticeSortSchema as schema} from "@/modules/placements/learner-notices-sort-model";
it("retains pinned-first default but permits chronological authorized notice order",()=>{
 const rows=[{id:"a",isPinned:false,createdAt:"2026-10-14T00:00:00Z"},{id:"b",isPinned:true,createdAt:"2026-10-13T00:00:00Z"}];
 expect(sort(rows,"pinned")[0].id).toBe("b");
 expect(sort(rows,"latest")[0].id).toBe("a");
 expect(sort(rows,"oldest")[0].id).toBe("b");
 expect(rows[0].id).toBe("a");
 expect(schema.safeParse("anything").success).toBe(false);
});
