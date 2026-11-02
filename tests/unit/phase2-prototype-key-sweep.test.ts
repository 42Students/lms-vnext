import {describe,expect,it} from "vitest";

/**
 * Phase 2 sweep: lookup tables written as plain objects (`MAP[status]`) return a native Object.prototype
 * function when the key is "constructor", "toString" or "__proto__" instead of a string or undefined. This
 * calls every exported function of every pure TPO/HR/recruiter model module with those keys and fails when the
 * result, or one of its top-level values, is a native Object function.
 */
const modules=import.meta.glob("../../src/modules/placements/*-model.ts") as Record<string,()=>Promise<Record<string,unknown>>>;
const SCOPE=/\/(?:[^/]*(?:tpo|recruit)[^/]*|hr-[^/]*|[^/]*-hr-[^/]*)-model\.ts$/i;
const KEYS=["constructor","toString","__proto__","hasOwnProperty","valueOf"];

const NATIVE=new Set<unknown>([
 Object,Object.prototype.toString,Object.prototype.hasOwnProperty,Object.prototype.valueOf,
 Object.prototype.isPrototypeOf,Object.prototype.propertyIsEnumerable,Object.prototype.toLocaleString,
 Object.prototype,
]);
const isLeak=(v:unknown)=>NATIVE.has(v)||(typeof v==="string"&&/\[native code\]/.test(v));
function leaks(result:unknown):boolean{
 if(isLeak(result))return true;
 if(result&&typeof result==="object"&&!Array.isArray(result)&&Object.getPrototypeOf(result)===Object.prototype)
  return Object.values(result as Record<string,unknown>).some(isLeak);
 return false;
}

const scoped=Object.entries(modules).filter(([p])=>SCOPE.test(p));

async function loadAll(){
 const loaded:{file:string;mod:Record<string,unknown>}[]=[];
 let failed=0;
 for(const [file,load] of scoped){
  try{loaded.push({file,mod:await load()});}catch{failed++;}
 }
 return {loaded,failed};
}

describe("PHASE2-PROTO prototype-key lookup sweep",()=>{
 it("PHASE2-PROTO-01 discovers a large pure model surface and imports nearly all of it",async()=>{
  const {loaded,failed}=await loadAll();
  expect(scoped.length).toBeGreaterThan(250);
  expect(loaded.length).toBeGreaterThan(scoped.length*0.9);
  expect(failed).toBeLessThan(scoped.length*0.1);
 },180000);

 it("PHASE2-PROTO-02 no exported model function returns a native Object function for a prototype-chain key",async()=>{
  const {loaded}=await loadAll();
  const offenders:string[]=[];
  let calls=0;
  for(const {file,mod} of loaded){
   for(const [name,fn] of Object.entries(mod)){
    if(typeof fn!=="function"||fn.length>3||fn.length===0)continue;
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
  expect(calls).toBeGreaterThan(1000);
  expect([...new Set(offenders)]).toEqual([]);
 },180000);
});
