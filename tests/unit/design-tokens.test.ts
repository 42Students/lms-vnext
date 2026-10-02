import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const globals = fs.readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("LMS color parity tokens", () => {
  const expected = {
    "--lms-primary": "#26bac7",
    "--lms-primary-hover": "#1e9aa8",
    "--lms-primary-text": "#1a95a1",
    "--lms-primary-subtle": "#eff8fa",
    "--lms-neutral-900": "#1a1d21",
    "--lms-neutral-700": "#54505d",
    "--lms-neutral-500": "#6b7280",
    "--lms-neutral-400": "#a9a7ae",
    "--lms-neutral-200": "#e5e9f0",
    "--lms-neutral-100": "#f1f4f9",
    "--lms-neutral-50": "#fafbfc",
    "--lms-success": "#059669",
    "--lms-warning": "#d97706",
    "--lms-error": "#ef4444",
  };

  for (const [token, value] of Object.entries(expected)) {
    it(`keeps ${token} exactly aligned with the LMS palette`, () => {
      expect(globals).toContain(`${token}: ${value};`);
    });
  }

  it("does not use Ant Design blue as a global vNext brand color", () => {
    expect(globals.toLowerCase()).not.toContain("#1890ff");
    expect(globals.toLowerCase()).not.toContain("#1677ff");
  });
});
