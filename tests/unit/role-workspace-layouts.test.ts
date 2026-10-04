import fs from "node:fs";
import path from "node:path";
import {
  describe,
  expect,
  it,
} from "vitest";

const roleLayouts = [
  {
    path: "src/app/(authenticated)/mentor/layout.tsx",
    guard: 'hasMembershipRole(\n      context,\n      "MENTOR",',
  },
  {
    path: "src/app/(authenticated)/tpo/layout.tsx",
    guard: 'hasMembershipRole(\n      context,\n      "TPO",',
  },
  {
    path: "src/app/(authenticated)/hr/layout.tsx",
    guard: "hasActiveRecruiter(context)",
  },
] as const;

describe("role workspace route guards", () => {
  for (const roleLayout of roleLayouts) {
    it(`guards ${roleLayout.path}`, () => {
      const content =
        fs.readFileSync(
          path.join(
            process.cwd(),
            roleLayout.path,
          ),
          "utf8",
        ).replace(/\r\n/g, "\n");

      expect(content).toContain(
        "getCurrentRequestContext",
      );
      expect(content).toContain(
        roleLayout.guard,
      );
      expect(content).toContain(
        'redirect("/dashboard")',
      );
    });
  }
});
