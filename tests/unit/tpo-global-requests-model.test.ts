import {expect,it} from "vitest";
import {globalTpoRequestsQuerySchema,requestKindMatches} from "@/modules/placements/tpo-global-requests-model";
it("uses a fixed kind allowlist and never converts unknown kinds to ALL",()=>{
 expect(globalTpoRequestsQuerySchema.parse({}).requestType).toBe("ALL");
 expect(globalTpoRequestsQuerySchema.safeParse({requestType:"PRIVATE"}).success).toBe(false);
 expect(globalTpoRequestsQuerySchema.parse({requestType:"ROUND_RESCHEDULE"}).requestType).toBe("ROUND_RESCHEDULE");
 expect(requestKindMatches("ROUND_RESCHEDULE","ROUND_RESCHEDULE")).toBe(true);
 expect(requestKindMatches("OFFER_EXTENSION","ROUND_RESCHEDULE")).toBe(false);
});
