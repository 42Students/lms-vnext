import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";

/**
 * Phase 1 ratchet: exported command/input schemas in the projects and placements modules must reject
 * unknown fields (.strict() / z.strictObject). A default z.object() silently strips unknown keys, which
 * hides client typos and mass-assignment attempts instead of failing them. Entries in LOOSE are existing
 * schemas that still strip; no schema may be added and an entry is removed once the schema is strict.
 */
const MODULES=["src/modules/projects","src/modules/placements"];
const LOOSE:Record<string,string>={
 "src/modules/projects/mentor-project-list-query.ts#mentorProjectListQuerySchema":
  "GET list-filter query string for the mentor project list; unknown query parameters such as cache busters are ignored by design and no write path uses it.",
};

function walk(dir:string,out:string[]=[]):string[]{
 for(const name of fs.readdirSync(dir)){
  const full=path.join(dir,name);
  if(fs.statSync(full).isDirectory())walk(full,out);
  else out.push(full);
 }
 return out;
}
const rel=(f:string)=>path.relative(process.cwd(),f).split(path.sep).join("/");

function closeParen(src:string,open:number):number{
 let depth=0;
 for(let i=open;i<src.length;i++){
  const c=src[i];
  if(c==="(")depth++;
  else if(c===")"){depth--;if(depth===0)return i;}
 }
 return -1;
}

type Schema={key:string;strict:boolean};
function exportedObjectSchemas():Schema[]{
 const out:Schema[]=[];
 for(const mod of MODULES)for(const f of walk(path.join(process.cwd(),mod))){
  if(!f.endsWith(".ts")||f.endsWith(".d.ts"))continue;
  const src=fs.readFileSync(f,"utf8");
  const re=/export\s+const\s+(\w+)\s*(?::[^=]+)?=\s*z\.(object|strictObject)\s*\(/g;
  let m:RegExpExecArray|null;
  while((m=re.exec(src))){
   const open=m.index+m[0].length-1;
   const close=closeParen(src,open);
   if(close<0)continue;
   const tail=src.slice(close+1);
   const end=tail.search(/;\s*(?:\n|$)|\n\s*\n/);
   const chain=end<0?tail:tail.slice(0,end);
   const strict=m[2]==="strictObject"||/\.strict\(\)/.test(chain)||/\.passthrough\(\)/.test(chain)||/\.catchall\(/.test(chain);
   out.push({key:`${rel(f)}#${m[1]}`,strict});
  }
 }
 return out;
}
const schemas=exportedObjectSchemas();

describe("PHASE1-STRICT exported schema strictness ratchet",()=>{
 it("PHASE1-STRICT-01 discovers the exported object schema surface",()=>{
  expect(schemas.length).toBeGreaterThan(150);
  expect(schemas.filter(s=>s.strict).length).toBeGreaterThan(100);
 });

 it("PHASE1-STRICT-02 no exported object schema silently strips unknown fields unless documented",()=>{
  const loose=schemas.filter(s=>!s.strict&&!(s.key in LOOSE)).map(s=>s.key);
  expect(loose,"make these z.strictObject / .strict(), or document why stripping is intended in LOOSE").toEqual([]);
 });

 it("PHASE1-STRICT-03 every documented loose schema still exists, is still loose, and has a real reason",()=>{
  for(const [key,reason] of Object.entries(LOOSE)){
   const found=schemas.find(s=>s.key===key);
   expect(found,`${key} no longer exists; remove the entry`).toBeDefined();
   expect(found!.strict,`${key} is now strict; remove the entry`).toBe(false);
   expect(reason.length,key).toBeGreaterThan(40);
  }
 });
});
