import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const activitySource = readFileSync(
  join(process.cwd(), "src/app/(authenticated)/activity/page.tsx"),
  "utf8",
);

describe("Activity Log forensic view switcher", () => {
  it("keeps both views 44px touch targets on phones, compact on desktop and keyboard-visible", () => {
    for (const [current, title] of [
      ['!rawMode', "Activity feed"],
      ['rawMode', "Raw Audit Logs"],
    ] as const) {
      const currentMarker = 'aria-current={' + current + '?"page":undefined}';
      const start = activitySource.indexOf(currentMarker);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = activitySource.indexOf('>' + title + '</Link>', start);
      expect(end).toBeGreaterThan(start);
      const link = activitySource.slice(start, end);
      expect(link).toContain('className="inline-flex min-h-11 items-center');
      expect(link).toContain('focus-visible:outline-2');
      expect(link).toContain('focus-visible:outline-offset-[3px]');
      expect(link).toContain('focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"');
    }
  });

  it("preserves accessible display group and URLs to both views", () => {
    expect(activitySource).toContain('role="group" aria-label="Activity display"');
    expect(activitySource).toContain('mode:"grouped"');
    expect(activitySource).toContain('mode:"raw"');
  });
});
