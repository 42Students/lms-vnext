import test from "node:test";
import assert from "node:assert/strict";
import { todayInIndia, timedDebarDraftError } from "../src/modules/placements/tpo-timed-debar-view-model.ts";

const draft = overrides => ({
  reason: "Repeated late placement registrations",
  duration: "DATE",
  untilDate: "2026-11-08",
  untilDrives: "1",
  today: "2026-11-07",
  ...overrides,
});

test("India-local day boundaries do not depend on the runner timezone", () => {
  assert.equal(todayInIndia(new Date("2026-11-07T18:29:00.000Z")), "2026-11-07");
  assert.equal(todayInIndia(new Date("2026-11-07T18:30:00.000Z")), "2026-11-08");
});

test("dated restrictions require valid today-or-later India dates", () => {
  assert.equal(timedDebarDraftError(draft({ untilDate: "2026-11-08" })), null);
  assert.equal(timedDebarDraftError(draft({ untilDate: "2026-11-07" })), null);
  for (const untilDate of ["", "2026-11-06", "2026-02-30"]) {
    assert.match(timedDebarDraftError(draft({ untilDate })) ?? "", /Choose today/);
  }
});

test("drive restrictions reject zero, negative, fractional and unsafe values", () => {
  for (const untilDrives of ["", "0", "-1", "2.5", "10001", "1e3", "Infinity"]) {
    assert.match(timedDebarDraftError(draft({ duration: "DRIVES", untilDrives })) ?? "", /whole number/);
  }
  assert.equal(timedDebarDraftError(draft({ duration: "DRIVES", untilDrives: "10000" })), null);
});

test("manual restrictions still require a meaningful reason", () => {
  assert.match(timedDebarDraftError(draft({ duration: "MANUAL", reason: "   " })) ?? "", /reason/);
  assert.equal(timedDebarDraftError(draft({ duration: "MANUAL", untilDate: "", untilDrives: "" })), null);
});
