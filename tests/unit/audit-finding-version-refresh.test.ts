import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("independent audit finding optimistic edit refresh",()=>{
 it("passes the persisted finding version to the dedicated editor and refreshes only after acknowledged CAS",()=>{
  const detail=read("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  const action=read("src/components/tracker/independent-finding-actions.tsx");
  expect(detail).toContain("version={finding.version}");
  expect(detail).toContain("status={finding.status}");
  expect(action).toContain("expectedVersion:version");
  expect(action).toContain("result.version<=version");
  expect(action).toContain("router.refresh()");
  expect(action).toContain("lock.current");
 });
});
