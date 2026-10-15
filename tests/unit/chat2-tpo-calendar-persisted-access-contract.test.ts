import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("TPO calendar active membership denial",()=>{
 it("checks the persisted TPO membership before calendar event display",()=>{
  const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/calendar/page.tsx"),"utf8");
  const guard=source.indexOf("await requirePersistedTpoMembership(context,context.membership.collegeId)");
  const render=source.indexOf("<PlacementCalendarWorkspace");
  expect(guard).toBeGreaterThan(0);
  expect(render).toBeGreaterThan(guard);
  expect(source).toContain('redirect("/dashboard")');
 });
});
