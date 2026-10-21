import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("course accessibility disclosures", () => {
  test("course overview loading and read-more state are announced", () => {
    const source = read("src/components/Course/Home/InThisCourseSection.jsx");
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain('role="status"');
    expect(source).toContain("const descriptionId = useId()");
    expect(source).toContain("aria-expanded={expanded}");
    expect(source).toContain("aria-controls={descriptionId}");
  });

  test("recent updates loading and announcement expansion are announced", () => {
    const source = read("src/components/Course/Home/UnifiedActivityList.jsx");
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain("Loading recent updates");
    expect(source).toContain("const announcementBodyId");
    expect(source).toContain("aria-expanded={isExpanded}");
    expect(source).toContain("aria-controls={announcementBodyId}");
  });

  test("class schedule exposes busy state and names its view selector", () => {
    const source = read("src/components/CalendarComp/ClassScheduleContent.jsx");
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain("Loading class schedule");
    expect(source).toContain('aria-label="Calendar view"');
  });
});
