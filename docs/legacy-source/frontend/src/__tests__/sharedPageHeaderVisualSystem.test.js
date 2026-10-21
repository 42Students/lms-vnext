import fs from "fs";
import path from "path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("shared page header visual hierarchy", () => {
  test("listing and course headers share the canonical desktop/mobile title scale", () => {
    const listing = read("src/styles/components/_listing-page-header.scss");
    const courses = read("src/styles/components/_learn-courses.scss");

    expect(listing).toMatch(/&__title\s*\{[\s\S]*?font-size:\s*\$text-3xl;/);
    expect(courses).toMatch(/\.learn-course-home-header[\s\S]*?&__title\s*\{[\s\S]*?font-size:\s*\$text-3xl;/);
    expect(listing).toMatch(/&__title\s*\{\s*font-size:\s*\$text-xl;/);
    expect(courses).toMatch(/&__title\s*\{[\s\S]*?font-size:\s*\$text-xl;/);
  });

  test("listing header spacing aliases the global rhythm instead of redefining pixel values", () => {
    const listing = read("src/styles/components/_listing-page-header.scss");
    expect(listing).toMatch(/\$s1:\s*\$space-2;/);
    expect(listing).toMatch(/\$s2:\s*\$space-4;/);
    expect(listing).toMatch(/\$s3:\s*\$space-5;/);
  });
});
