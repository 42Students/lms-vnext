import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("legacy contacts and TPO mobile navigation parity", () => {
  it("keeps Name / Email / Contact / Role table headings and masks private values", () => {
    const file = source("src/components/courses/faculty-contacts-table.tsx");
    expect(file).toContain('<th scope="col">Name</th><th scope="col">Email</th><th scope="col">Contact</th>');
    expect(file).toContain('Department: {item.departmentName??"Not recorded"}');
    expect(file).not.toContain('<th scope="col">Department</th>');
    expect(file).toContain('<td className="min-w-32 text-muted-foreground">Private</td>');
    expect(file).toContain('{showRoles?<th scope="col">Role</th>:null}');
  });

  it("sends phone More directly to the authenticated More page with an active state", () => {
    const file = source("src/components/tpo/tpo-mobile-footer.tsx");
    expect(file).toContain('{label:"More",href:"/tpo/more"');
    expect(file).toContain('link.label === "More" ? moreActive');
    expect(file).toContain('aria-current={active ? "page" : undefined}');
    expect(file).not.toContain("BottomSheet");
  });
});
