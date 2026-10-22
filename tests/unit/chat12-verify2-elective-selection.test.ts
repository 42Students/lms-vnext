import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const ui=readFileSync("src/components/academics/elective-eligible-selection.tsx","utf8");
const page=readFileSync("src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx","utf8");
describe("chat-12 elective bulk allocation",()=>{
 it("offers 50-row pages and retained 100-member selection",()=>{
  expect(ui).toContain("const pageSize=50,selectionLimit=100");
  expect(ui).toContain("sessionStorage.setItem");
  expect(ui).toContain("sessionStorage.getItem");
  expect(ui).toContain('type="hidden" name="membershipId"');
  expect(page).toContain("<ElectiveEligibleSelection slotId={slotId} students={students}");
 });
 it("keeps the server's scoped membership/group validation",()=>{
  expect(page).toContain("await scopedSlot(slotId)");
  expect(page).toContain('formData.getAll("membershipId")');
  expect(page).toContain('joinGroup(context, groupId, membershipId, "MANUAL")');
 });
});
