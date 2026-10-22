import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx",import.meta.url),"utf8");
describe("UX-tpo-batches-batchid-registrations-02",()=>{
 it("uses the audited shared PageHeader and keeps existing actions",()=>{
  expect(source).toContain("<PageHeader");
  expect(source).toContain("<Input");
  expect(source).toContain("<Select");
  expect(source).toContain('<Button type="submit"');
  expect(source).toContain('>Filter</Button>');
  expect(source).toContain('action={"/tpo/batches/"+batchId+"/registrations"}');
 });
});
