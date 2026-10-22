import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-registrations-membershipid-history-02",()=>{
 it("uses the audited shared PageHeader and keeps existing actions",()=>{
  expect(source).toContain("<PageHeader");
  expect(source).toContain("<Select");
  expect(source).toContain('<Button type="submit" className="min-h-11 w-full lg:w-auto">Apply</Button>');
 });
});
