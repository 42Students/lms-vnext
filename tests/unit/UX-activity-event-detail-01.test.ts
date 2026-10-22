import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("UX-activity-event-detail-01",()=>{
 it("keeps tenant permissions, exact event labels and meaningful breadcrumb",()=>{
  const page=read("src/app/(authenticated)/activity/[eventId]/page.tsx");
  expect(page).toContain('redirect("/dashboard")');
  expect(page).toContain("getActivityEventDetail(context, eventId)");
  expect(page).toContain('Breadcrumbs items={[{ label: "Activity Log", href: "/activity" }, { label: event.summary }]}');
  expect(page).toContain('title={event.summary}');
  expect(page).toContain("Back to activity");
 });
 it("uses shared cards, IST machine timestamps and a contained metadata panel",()=>{
  const page=read("src/app/(authenticated)/activity/[eventId]/page.tsx");
  expect(page).toContain('<section className="min-w-0 space-y-4 border-b border-border pb-5">');
  expect(page).toContain('<time dateTime={event.occurredAt.toISOString()}>');
  expect(page).toContain("Asia/Kolkata");
  expect(page).toContain("max-w-full overflow-auto");
  expect(page).toContain("This event has no structured context.");
  expect(page).toContain("Event context");
 });
 it("keeps bounded load and safe error fallback",()=>{
  expect(read("src/app/(authenticated)/activity/[eventId]/loading.tsx")).toContain("<GracefulPageLoading");
  expect(read("src/app/(authenticated)/activity/[eventId]/error.tsx")).toContain("GracefulErrorBoundary");
 });
});