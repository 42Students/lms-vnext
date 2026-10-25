import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Mentor cross audit delivery discovery and contrast",()=>{
 it("UX-mentor-cross-N01 approved Delivery section has a discoverable selected tab",()=>{
  const nav=read("src/components/projects/mentor-project-tabs.tsx");
  const page=read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  const workspace=read("src/components/projects/project-workspace.tsx");
  expect(nav).not.toContain('{ key: "delivery", label: "Delivery" }');
  expect(nav).toContain('label: "Team & meetings"');
  expect(nav).toContain('label: "Activity"');
  expect(page).toContain('delivery: "Overview"');
  expect(page).toContain('selectedTab === "delivery"');
  expect(workspace).toContain('delivery: "Delivery"');
  expect(page).toContain('<MentorPrototypeDeliveryEvidence workspace={workspace}');
 });
 it("UX-mentor-cross-N02 ProjectList uses accessible text and keyboard focus on all roles",()=>{
  const src=read("src/components/projects/project-list.tsx");
  expect(src).toContain("hover:bg-primary-subtle");
  expect(src).toContain("focus-visible:outline-2");
  expect(src).not.toContain("text-[#26bac7]");
  expect(src).not.toContain("focus-visible:ring-[var(--lms-focus-ring)]");
 });
 it("UX-mentor-cross-N03 closeout submission is guarded and minimum-sized",()=>{
  const src=read("src/components/projects/mentor-project-closeout-control.tsx");
  expect(src).toContain("if(pending||inFlight.current||!checks.every(Boolean)) return;");
  expect(src).toContain('loading={pending}');
  expect(src).toContain("<ConfirmDialog");
  expect(src).not.toContain("min-h-10");
 });
});
