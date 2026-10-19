"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import type {AcademicModuleScope} from "@/modules/module-access/admin-descendant-rule-write";
type Observed={enabled:boolean;locked:boolean}|null;
export function DescendantFeatureRuleEditor({collegeId,scopes}:{collegeId:string;scopes:readonly AcademicModuleScope[]}){
 const router=useRouter(),[scopeKey,setScopeKey]=useState(""),[module,setModule]=useState<"projects"|"placements"|"electives">("projects");
 const [stored,setStored]=useState<Observed|undefined>(undefined),[choice,setChoice]=useState("INHERIT"),
  [locked,setLocked]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const scope=scopes.find(x=>x.scopeType+":"+x.scopeId===scopeKey);
 const url="/api/admin/features/"+encodeURIComponent(collegeId)+"/descendants";
 async function recheck(){
  if(!scope)return;
  setBusy(true);setMessage("");setStored(undefined);
  try{
   const params=new URLSearchParams({scopeType:scope.scopeType,scopeId:scope.scopeId,module});
   const response=await fetch(url+"?"+params,{cache:"no-store"});
   if(!response.ok)throw Error("Cannot load a verified stored rule.");
   const data=await response.json() as {stored:Observed};
   setStored(data.stored);setChoice(!data.stored?"INHERIT":data.stored.enabled?"ON":"OFF");
   setLocked(data.stored?.locked??false);
  }catch(error){setMessage(error instanceof Error?error.message:"Load failed.");}
  finally{setBusy(false);}
 }
 async function save(){
  if(!scope||stored===undefined||busy||!window.confirm("Apply this module rule to the selected academic scope?"))return;
  setBusy(true);setMessage("");
  try{
   const payload=choice==="INHERIT"?{scopeType:scope.scopeType,scopeId:scope.scopeId,module,action:"INHERIT",expected:stored}:
    {scopeType:scope.scopeType,scopeId:scope.scopeId,module,action:"SET",enabled:choice==="ON",locked,expected:stored};
   const response=await fetch(url,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   if(!response.ok){const body=await response.json().catch(()=>({error:"SAVE_FAILED"}));throw Error(body.error??"Save failed");}
   const body=await response.json() as {stored:Observed};
   setStored(body.stored);setMessage("Module access saved.");router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Save failed");}
  finally{setBusy(false);}
 }
 return <div className="mt-4 flex flex-wrap items-end gap-3">
  <label className="grid min-w-48 flex-1 gap-1 text-sm">Academic scope
   <Select className="min-h-11 sm:min-h-9" value={scopeKey}
    onChange={e=>{setScopeKey(e.target.value);setStored(undefined);setMessage("");}}>
    <option value="">Select Department, Program, Batch or Class</option>
    {scopes.map(item=><option key={item.scopeType+":"+item.scopeId} value={item.scopeType+":"+item.scopeId}>
      {item.scopeType==="COHORT"?"BATCH":item.scopeType} · {item.label}
    </option>)}
   </Select>
  </label>
  <label className="grid gap-1 text-sm">Module
   <Select className="min-h-11 sm:min-h-9" value={module}
    onChange={e=>{setModule(e.target.value as "projects"|"placements"|"electives");setStored(undefined);}}>
    <option value="projects">Projects</option><option value="placements">Placements</option><option value="electives">Electives</option>
   </Select>
  </label>
  <Button type="button" variant="secondary" className="min-h-11 sm:min-h-9" disabled={!scope||busy} onClick={()=>void recheck()}>Recheck</Button>
  {stored!==undefined&&<><label className="grid gap-1 text-sm">Stored rule
   <Select value={choice} className="min-h-11 sm:min-h-9" onChange={e=>setChoice(e.target.value)}>
    <option value="INHERIT">Inherit</option><option value="ON">On</option><option value="OFF">Off</option>
   </Select></label>
   <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={locked} disabled={choice==="INHERIT"} onChange={e=>setLocked(e.target.checked)}/>Lock</label>
   <Button type="button" className="min-h-11 sm:min-h-9" disabled={busy} onClick={()=>void save()}>Save rule</Button>
  </>}
  {message&&<p role="status" className="w-full text-sm text-body">{message}</p>}
  {scopes.length>=500&&<p className="w-full text-sm text-warning-text">This page displays up to 500 academic scopes. Open the next hierarchy page to edit later scopes.</p>}
 </div>;
}
