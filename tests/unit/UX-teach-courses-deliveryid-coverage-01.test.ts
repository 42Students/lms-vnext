import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teach-courses-deliveryid-01 /teach/courses/[deliveryId] keeps report scope and state contracts",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx"),"utf8");
 expect(s).toContain("notFound()");
 expect(s).toContain("getCurrentRequestContext");
});
