import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const uiFiles = [
  "src/components/ui/button.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/page-header.tsx",
  "src/components/ui/empty-state.tsx",
  "src/components/ui/status-badge.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/confirm-dialog.tsx",
  "src/components/ui/toast.tsx",
  "src/components/shell/app-shell.tsx",
  "src/components/shell/sidebar-nav.tsx",
  "src/components/shell/membership-switcher.tsx",
  "src/components/shell/admin-scope-switcher.tsx",
  "src/components/shell/account-actions.tsx",
  "src/components/admin/organization-create-form.tsx",
  "src/components/admin/college-create-form.tsx",
  "src/components/admin/department-create-form.tsx",
];

describe("first UI batch color parity", () => {
  const content = uiFiles
    .map((file) =>
      fs.readFileSync(path.join(process.cwd(), file), "utf8"),
    )
    .join("\n");

  it("does not introduce replacement Tailwind brand palettes", () => {
    for (const forbidden of [
      "zinc-",
      "slate-",
      "blue-",
      "cyan-",
      "emerald-",
      "amber-",
      "red-",
    ]) {
      expect(content).not.toContain(forbidden);
    }
  });

  it("uses the canonical LMS semantic token utilities", () => {
    expect(content).toContain("bg-primary");
    expect(content).toContain("bg-primary-subtle");
    expect(content).toContain("border-border");
    expect(content).toContain("text-primary-text");
    expect(content).toContain("text-foreground");
    expect(content).toContain("text-body");
  });
});
