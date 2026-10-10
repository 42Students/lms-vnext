import { describe, expect, it } from "vitest";
import {
  deliveryContentOrderInputSchema,
} from "@/modules/courses/lesson-content-order-validation";

const lessonId =
  "11111111-1111-4111-8111-111111111111";
const deliveryId =
  "22222222-2222-4222-8222-222222222222";
const c1 =
  "33333333-3333-4333-8333-333333333333";
const c2 =
  "44444444-4444-4444-8444-444444444444";

describe("W02 DB05 delivery lesson-content order", () => {
  it("accepts a unique ordered content set", () => {
    expect(
      deliveryContentOrderInputSchema.parse({
        lessonId,
        deliveryId,
        orderedContentIds: [c2, c1],
      }).orderedContentIds,
    ).toEqual([c2, c1]);
  });

  it("rejects duplicate IDs because a full order cannot contain two positions for one content", () => {
    const parsed =
      deliveryContentOrderInputSchema.safeParse({
        lessonId,
        deliveryId,
        orderedContentIds: [c1, c1],
      });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty or malformed order payloads before authorization/database work", () => {
    expect(
      deliveryContentOrderInputSchema.safeParse({
        lessonId,
        deliveryId,
        orderedContentIds: [],
      }).success,
    ).toBe(false);
    expect(
      deliveryContentOrderInputSchema.safeParse({
        lessonId,
        deliveryId,
        orderedContentIds: ["not-a-uuid"],
      }).success,
    ).toBe(false);
  });
});
