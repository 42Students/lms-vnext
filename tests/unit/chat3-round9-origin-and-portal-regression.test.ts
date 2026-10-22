import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
describe("Chat-3 Round 9 restored contracts",()=>{
 it("TPO-drives-29/30/38 external employer portal uses safe same-tab navigation",()=>{
  const src=read("src/components/placements/placement-drive-workspace.tsx");
  // The portal is now an HTTPS-validated same-tab navigation: no target=_blank needed.
  expect(src).toContain('<ThirdPartyLink href={job.legacyPostingDetails.portal.url} label="Open employer portal"/>');
  const safe=read("src/components/ui/third-party-link.tsx");
  expect(safe).toContain('url.protocol === "https:"');
  expect(safe).toContain("!url.username && !url.password");
  expect(safe).not.toContain('target="_blank"');
  expect(safe).not.toContain('target="_blank"');
  expect(safe).toContain('href={safeHref}');
  expect(safe).toContain('role="alert"');
  expect(safe).toContain("The link could not be opened.");
  expect(src).toContain("Open employer portal");
 });
 it("api-origin-guard protects POST and DELETE assignment materials at route boundaries",()=>{
  const src=read("src/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/materials/route.ts");
  for(const method of ["POST","DELETE"]){
   const block=src.slice(src.indexOf("export async function "+method+"("));
   expect(block).toContain("if(!isSameOriginRequest(request))");
   expect(block).toContain('error:"INVALID_ORIGIN"');
  }
  expect(src).toContain("async function change(request:Request,params:Params");
 });
});
