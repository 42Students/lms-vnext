import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Mentor cross audit access state and meeting controls",()=>{
 it("UX-mentor-cross-M01 failed module resolution is not described as disabled",()=>{
  expect(read("src/app/(authenticated)/mentor/calendar/page.tsx")).toContain("loadFailed={access===null}");
  expect(read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx")).toContain("loadFailed={available===null}");
  expect(read("src/components/projects/mentor-projects-unavailable.tsx")).toContain("This does not mean Projects is disabled.");
 });
 it("UX-mentor-cross-M02 slow landing loads have a bounded retry",()=>{
  expect(read("src/app/(authenticated)/mentor/loading.tsx")).toContain("GracefulPageLoading");
  expect(read("src/components/ui/graceful-page-loading.tsx")).toContain("12_000");
 });
 it("UX-mentor-cross-M03 meeting actions have 44px targets and safe URLs",()=>{
  const meeting=read("src/components/projects/mentor-meetings-calendar.tsx");
  expect(meeting).toContain("safeProjectExternalHref(href)");
  const css=read("src/components/projects/mentor-meetings-calendar.module.css");
  expect(meeting).toContain("className={styles.action}");
  expect(css).toMatch(/\.action\s*\{[^}]*min-height:\s*44px/s);
  expect(css).toContain(".action:focus-visible");
  expect(css).toContain("outline: 2px solid");
  expect(read("src/components/projects/mentor-calendar-load-failure.tsx")).toContain('<Button type="button" variant="secondary"');
 });
});
