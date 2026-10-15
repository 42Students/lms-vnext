import { expect, it } from "vitest";
import { tpoMessagePageSchema } from "@/modules/placements/tpo-team-conversation-service";
it("bounds Team message pages and refuses malformed windows",()=>{
 expect(tpoMessagePageSchema.parse(undefined)).toBe(1);
 expect(tpoMessagePageSchema.parse("2")).toBe(2);
 expect(tpoMessagePageSchema.safeParse("0").success).toBe(false);
 expect(tpoMessagePageSchema.safeParse("10001").success).toBe(false);
 expect(tpoMessagePageSchema.safeParse("NaN").success).toBe(false);
});
