import { describe, expect, it } from "vitest";
import { parsePlacementCascadeId } from "@/modules/placements/placement-cascade-policy";

const id = "a0e43af8-8fa4-4b2c-bb94-aa36cc4e8e38";
describe("P-S1-06 placement cascade correlation", () => {
  it("extracts the acceptance id and sibling history reason", () => {
    expect(parsePlacementCascadeId(`cascade:${id}`)).toBe(id);
    expect(parsePlacementCascadeId(`placed elsewhere; cascade:${id}`)).toBe(id);
  });
  it("ignores unrelated text and invalid tokens", () => {
    expect(parsePlacementCascadeId(null)).toBeNull();
    expect(parsePlacementCascadeId("placed elsewhere")).toBeNull();
    expect(parsePlacementCascadeId("cascade:abc")).toBeNull();
  });
});
