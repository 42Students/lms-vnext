import { describe, expect, it } from "vitest";
import { dateInIndia } from "@/modules/placements/drive-day-coordinator-service";

describe("drive-day local date", () => {
  it("uses Asia/Kolkata for assignment-day boundaries", () => {
    expect(
      dateInIndia(
        new Date(
          "2026-10-05T18:29:59.000Z",
        ),
      ),
    ).toBe("2026-10-05");
    expect(
      dateInIndia(
        new Date(
          "2026-10-05T18:30:00.000Z",
        ),
      ),
    ).toBe("2026-10-06");
  });
});
