import {describe,expect,it} from "vitest";
import {readFileSync,readdirSync} from "node:fs";
import {join,relative} from "node:path";
const root=join(process.cwd(),"src/app/api/projects");
function walk(folder:string):string[]{
 return readdirSync(folder,{withFileTypes:true}).flatMap(entry=>
  entry.isDirectory()?walk(join(folder,entry.name)):entry.isFile()&&entry.name==="route.ts"?[join(folder,entry.name)]:[]);
}
const routeFiles=()=>walk(root);
describe("IIT Dharwad Projects full API route adversarial sweep",()=>{
 it("PROJ-BREAK-csrf-01 all Projects API mutation handlers have a same-origin gate (no silent bypass)",()=>{
  const files=routeFiles();
  expect(files.length).toBeGreaterThanOrEqual(80);
  let mutationRoutes=0;
  for(const file of files){
   const source=readFileSync(file,"utf8");
   const methods=[...source.matchAll(/export async function (POST|PATCH|PUT|DELETE)\s*\(/g)].map(match=>match[1]);
   if(!methods.length)continue;
   mutationRoutes++;
   expect(source,relative(root,file)).toContain("isSameOriginRequest");
   expect(source,relative(root,file)).toContain("getCurrentRequestContext");
   expect(source,relative(root,file)).toContain("apiErrorResponse");
   expect(source,relative(root,file)).toMatch(/status:\s*403/);
  }
  expect(mutationRoutes).toBeGreaterThanOrEqual(65);
 });
 it("PROJ-BREAK-csrf-02 a read-only Projects API route must not introduce a direct database mutation",()=>{
  for(const file of routeFiles()){
   const source=readFileSync(file,"utf8");
   if(!/export async function GET\s*\(/.test(source) || /export async function (POST|PATCH|PUT|DELETE)\s*\(/.test(source))continue;
   // Services provide the read permission checks. A GET route must not write directly.
   expect(source,relative(root,file)).not.toMatch(/\bgetDb\(\)\.\s*(insert|update|delete)\s*\(/);
  }
 });
 it("PROJ-BREAK-csrf-03 Projects download grant remains a POST with authorization and audit, not open GET",()=>{
  const file=join(root,"[projectId]/resource-files/[fileId]/download-grant/route.ts");
  const source=readFileSync(file,"utf8");
  expect(source).toMatch(/export async function POST/);
  expect(source).not.toMatch(/export async function GET/);
  expect(source).toContain("isSameOriginRequest(request)");
  expect(source).toContain("issueProjectFileDownloadGrant");
 });
});
