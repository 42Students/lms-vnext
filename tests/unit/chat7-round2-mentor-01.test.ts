import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("chat-7 round 2: mentor project card and read-only legacy parity", () => {
  it("MEN-projects-meetings-03 grounded course and due metadata", () => {
    const source = readFileSync("src/components/projects/project-list.tsx", "utf8");
    expect(source).toContain("item.courseLabel");
    expect(source).toContain("item.dueState");
  });
  it("MEN-projects-meetings-04 blocked-work board navigation", () => {
    const source = readFileSync("src/components/projects/project-list.tsx", "utf8");
    expect(source).toContain("item.blockedHref");
    expect(source).toContain("Open blocked work");
  });
  it("MEN-projects-meetings-05 visible review and workspace actions", () => {
    const source = readFileSync("src/components/projects/project-list.tsx", "utf8");
    expect(source).toContain("item.actionLine");
    expect(source).toContain("Open workspace");
  });
  it("MEN-projects-meetings-14 real mentor/course subtitle", () => {
    const source = readFileSync("src/components/projects/project-workspace.tsx", "utf8");
    expect(source).toContain("description={mode===\"MENTOR\"");
    expect(source).toContain("\"Mentor: \"");
    expect(source).toContain("courseLabel");
  });
  it("MEN-projects-meetings-15 archived/completed read-only message", () => {
    const source = readFileSync("src/components/projects/project-workspace.tsx", "utf8");
    expect(source).toContain("This workspace is archived. You can read everything here");
    expect(source).toContain("Completed project · read only");
  });
});
