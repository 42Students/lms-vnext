import { describe, expect, it } from "vitest";
import {
  isPlacementApplicationDeadlinePassed,
} from "@/modules/placements/application-deadline-policy";

describe("W04 exact placement application deadline", () => {
  const deadline = new Date("2026-10-10T10:00:00.000Z");

  it("allows Apply only before the exclusive instant", () => {
    expect(isPlacementApplicationDeadlinePassed(
      deadline, new Date("2026-10-10T09:59:59.999Z"),
    )).toBe(false);
    expect(isPlacementApplicationDeadlinePassed(deadline, deadline)).toBe(true);
    expect(isPlacementApplicationDeadlinePassed(
      deadline, new Date("2026-10-10T10:00:00.001Z"),
    )).toBe(true);
  });

  it("does not invent a cutoff when a drive has no application deadline", () => {
    expect(isPlacementApplicationDeadlinePassed(
      null, new Date("2100-01-01"),
    )).toBe(false);
  });
});
