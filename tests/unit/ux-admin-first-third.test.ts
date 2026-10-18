import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin UX first-third rollout",()=>{
 it("UX-admin-batches-01 responsive shared DataTable with explicit empty text and preserved controls",()=>{
   const page=read("src/app/(authenticated)/admin/batches/page.tsx");
   expect(page).toContain('<PageHeader eyebrow="Super Admin · Academic Setup" title="Batches"');
   expect(page).toContain('<DataTable<(typeof data.items)[number]>');
   expect(page).toContain('mobilePriority:"action"');
   expect(page).toContain('No matching batches on this page.');
   expect(page).toContain('min-w-0 w-full sm:min-w-');
   expect(page).not.toContain('min-w-[38rem]');
 });
 it("UX-admin-classes-01 responsive shared DataTable with explicit empty text and preserved controls",()=>{
   const page=read("src/app/(authenticated)/admin/classes/page.tsx");
   expect(page).toContain('<PageHeader eyebrow="Super Admin · Academic Setup" title="Classes"');
   expect(page).toContain('<DataTable<(typeof data.items)[number]>');
   expect(page).toContain('mobilePriority:"action"');
   expect(page).toContain('No matching classes on this page.');
   expect(page).toContain('min-w-0 w-full sm:min-w-');
   expect(page).not.toContain('min-w-[38rem]');
 });
});
