import { describe, expect, it } from "vitest";
import { createSubmissionFlightGuard } from "@/modules/courses/learner-submission-flight-model";

describe("learner final submission single-flight guard", () => {
  it("blocks repeated same-render submit events until the request settles", () => {
    const flight = createSubmissionFlightGuard();
    expect(flight.begin()).toBe(true);
    expect(flight.begin()).toBe(false);
    flight.end();
    expect(flight.begin()).toBe(true);
  });
  it("allows an invalid form to release the lock for correction", () => {
    const flight = createSubmissionFlightGuard();
    expect(flight.begin()).toBe(true);
    flight.end();
    expect(flight.begin()).toBe(true);
  });
});
