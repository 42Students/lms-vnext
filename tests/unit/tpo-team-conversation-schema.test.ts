import { expect, it } from "vitest";
import { tpoThreadIdSchema } from "@/modules/placements/tpo-team-conversation-service";
it("requires a UUID for private team conversation details", () => {
  expect(tpoThreadIdSchema.safeParse("../recruiter").success).toBe(false);
  expect(tpoThreadIdSchema.safeParse("11111111-1111-4111-8111-111111111111").success).toBe(true);
});
