import { describe, expect, it } from "vitest";
import { isCareerRoundVisible } from "@/modules/placements/learner-round-visibility-policy";

describe("W04 learner placement round navigation", () => {
  it("uses DB round kind, not a misleading editable round name", () => {
    expect(isCareerRoundVisible("ASSESSMENT", "TEST")).toBe(true);
    expect(isCareerRoundVisible("ASSESSMENT", "VENDOR_TEST")).toBe(true);
    expect(isCareerRoundVisible("ASSESSMENT", "INTERVIEW")).toBe(false);
    expect(isCareerRoundVisible("INTERVIEW", "INTERVIEW")).toBe(true);
    expect(isCareerRoundVisible("INTERVIEW", "GD")).toBe(true);
    expect(isCareerRoundVisible("INTERVIEW", "TEST")).toBe(false);
    expect(isCareerRoundVisible("INTERVIEW", "VENDOR_TEST")).toBe(false);
  });
  it("puts placement talks in career calendar, not interview or assessment queues", () => {
    expect(isCareerRoundVisible("ASSESSMENT", "TALK")).toBe(false);
    expect(isCareerRoundVisible("INTERVIEW", "TALK")).toBe(false);
    expect(isCareerRoundVisible("CALENDAR", "TALK")).toBe(true);
  });
  it("fails closed for unknown round kinds outside the inclusive calendar", () => {
    expect(isCareerRoundVisible("ASSESSMENT", "TESTS")).toBe(false);
    expect(isCareerRoundVisible("INTERVIEW", "ASSESSMENT")).toBe(false);
    expect(isCareerRoundVisible("CALENDAR", "INTERVIEW")).toBe(true);
  });
});
