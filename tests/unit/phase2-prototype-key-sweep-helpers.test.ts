import {describe,expect,it} from "vitest";

/**
 * Phase 2 sweep, part 2: the same prototype-chain-key sweep as phase2-prototype-key-sweep.test.ts, applied to the
 * pure helper files of the TPO/HR/recruiter scope that are NOT named *-model.ts (policies, copy, labels, links,
 * presets, defaults). To stay side-effect free it skips async functions, mutating-looking names and any file that
 * talks to a provider, mailer, storage or network.
 */
const modules=import.meta.glob("../../src/modules/placements/*.ts") as Record<string,()=>Promise<Record<string,unknown>>>;
const SCOPE=/\/(?:[^/]*(?:tpo|recruit)[^/]*|hr-[^/]*|[^/]*-hr-[^/]*)\.ts$/i;
const EXCLUDE_FILE=/(-model|-service|-repository|-actions|-provider|-mailer|-email|-mail|-client|-storage|-fetch|-network|-delivery|-send|\.test|\.d)\.ts$|provider|mailer|delivery|storage|webhook/i;
const EXCLUDE_FN=/^(create|update|delete|remove|set|save|add|apply|bulk|send|record|submit|publish|cancel|clone|undo|assign|revoke|grant|terminate|decide|import|invite|deliver|enqueue|schedule|sync|upload|write|insert|persist)/i;
const KEYS=["constructor","toString","__proto__","hasOwnProperty","valueOf"];

const NATIVE=new Set<unknown>([
 Object,Object.prototype.toString,Object.prototype.hasOwnProperty,Object.prototype.valueOf,
 Object.prototype.isPrototypeOf,Object.prototype.propertyIsEnumerable,Object.prototype.toLocaleString,Object.prototype,
]);
const isLeak=(v:unknown)=>NATIVE.has(v)||(typeof v==="string"&&/\[native code\]/.test(v));
function leaks(result:unknown):boolean{
 if(isLeak(result))return true;
 if(result&&typeof result==="object"&&!Array.isArray(result)&&Object.getPrototypeOf(result)===Object.prototype)
  return Object.values(result as Record<string,unknown>).some(isLeak);
 return false;
}

const scoped=Object.entries(modules).filter(([p])=>SCOPE.test(p)&&!EXCLUDE_FILE.test(p));

async function loadAll(){
 const loaded:{file:string;mod:Record<string,unknown>}[]=[];
 let failed=0;
 for(const [file,load] of scoped){
  try{loaded.push({file,mod:await load()});}catch{failed++;}
 }
 return {loaded,failed};
}

describe("PHASE2-PROTO-HELPERS prototype-key sweep for non-model helpers",()=>{
 it("PHASE2-PROTO-HELPERS-01 discovers the helper surface and imports most of it",async()=>{
  const {loaded}=await loadAll();
  expect(scoped.length).toBeGreaterThan(40);
  expect(loaded.length).toBeGreaterThan(scoped.length*0.6);
 },180000);

 it("PHASE2-PROTO-HELPERS-02 no synchronous helper returns a native Object function for a prototype-chain key",async()=>{
  const {loaded}=await loadAll();
  const offenders:string[]=[];
  let calls=0;
  for(const {file,mod} of loaded){
   for(const [name,fn] of Object.entries(mod)){
    if(typeof fn!=="function"||fn.length>3||fn.length===0)continue;
    if(fn.constructor.name==="AsyncFunction"||EXCLUDE_FN.test(name))continue;
    for(const key of KEYS){
     for(const args of [[key],[key,key],[key,key,key]].slice(0,Math.max(1,fn.length))){
      let result:unknown;
      try{
       result=(fn as (...a:unknown[])=>unknown)(...args);
       if(result&&typeof (result as Promise<unknown>).then==="function"){
        (result as Promise<unknown>).catch(()=>undefined);
        continue;
       }
      }catch{continue;}
      calls++;
      if(leaks(result))offenders.push(`${file.replace("../../","")}#${name}(${args.map(a=>JSON.stringify(a)).join(",")})`);
     }
    }
   }
  }
  expect(calls).toBeGreaterThan(100);
  expect([...new Set(offenders)]).toEqual([]);
 },180000);
});
