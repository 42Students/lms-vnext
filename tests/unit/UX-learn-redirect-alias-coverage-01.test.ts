import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../src/app/(authenticated)/"+path+"/page.tsx",import.meta.url),"utf8");
describe("UX-learn-redirect-alias-coverage-01 canonical learner entrypoints",()=>{
 const redirects=[
  ["learn","/learn/courses"],
  ["learn/assignments","/learn/allAssignments"],
  ["learn/quizzes","/learn/allQuizzes"],
  ["learn/placements","/learn/my-placements"],
 ] as const;
 for(const [alias,target] of redirects){
  it(`UX-learn-alias ${alias} uses canonical feature page instead of a blank duplicate UI`,()=>{
   const src=read(alias);
   expect(src).toContain('import { redirect } from "next/navigation"');
   expect(src).toContain(`redirect("${target}")`);
   expect(src).not.toContain("<PageHeader");
   expect(src).not.toContain("return <div");
  });
 }
 it("UX-learn-course-alias /learn/courses/[deliveryId] percent-encodes the requested course and redirects to scoped /home",()=>{
  const src=read("learn/courses/[deliveryId]");
  expect(src).toContain("params:Promise<{deliveryId:string}>");
  expect(src).toContain("const [{deliveryId},query]=await Promise.all([params,searchParams]);");
  expect(src).toContain("encodeURIComponent(deliveryId)");
  expect(src).toContain("/home");
  expect(src).toContain("redirect(");
 });
});
