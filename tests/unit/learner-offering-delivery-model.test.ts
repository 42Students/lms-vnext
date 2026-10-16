import { describe, expect, it } from "vitest";
import { resolveLearnerOfferingDelivery } from "@/modules/courses/learner-offering-delivery-model";

const rows = [
  { id: "a1", deliveryId: "d1", courseName: "Java" },
  { id: "a2", deliveryId: "d1", courseName: "Java" },
  { id: "a2", deliveryId: "d2", courseName: "DSA" },
];

describe("learner offering delivery resolution", () => {
  it("passes an explicit deliveryId through for strict validation", () => {
    expect(resolveLearnerOfferingDelivery(rows, "a1", "d9")).toEqual({ kind: "selected", deliveryId: "d9" });
  });
  it("resolves a single authorized delivery", () => {
    expect(resolveLearnerOfferingDelivery(rows, "a1", undefined)).toEqual({ kind: "selected", deliveryId: "d1" });
  });
  it("asks the learner to choose when several deliveries match", () => {
    const result = resolveLearnerOfferingDelivery(rows, "a2", undefined);
    expect(result).toEqual({ kind: "choose", options: [
      { deliveryId: "d1", courseName: "Java" }, { deliveryId: "d2", courseName: "DSA" },
    ] });
  });
  it("reports none for an offering the learner is not authorized for", () => {
    expect(resolveLearnerOfferingDelivery(rows, "zz", undefined)).toEqual({ kind: "none" });
  });
});
