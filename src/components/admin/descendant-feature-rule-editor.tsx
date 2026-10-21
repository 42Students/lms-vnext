"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import type {AcademicModuleScope} from "@/modules/module-access/admin-descendant-rule-write";
type Observed={enabled:boolean;locked:boolean}|null;
export function DescendantFeatureRuleEditor({collegeId,scopes}:{collegeId:string;scopes:readonly AcademicModuleScope[]}){
 const router=useRouter(),[scopeKey,setScopeKey]=useState(""),[module,setModule]=useState<"projects"|"placements"|"electives">("projects");
 const [stored,setStored]=useState<Observed|undefined>(undefined),[choice,setChoice]=useState("INHERIT"),
  [locked,setLocked]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [expanded,setExpanded]=useState(false);
 const selectionRevision=useRef(0),savingRef=useRef(false);
 const selectScope=(value:string)=>{
  selectionRevision.current++;
  setScopeKey(value);setStored(undefined);setChoice("INHERIT");setLocked(false);setMessage("");
 };
 const {askConfirm,dialog}=useConfirmFlow();
 const scope=scopes.find(x=>x.scopeType+":"+x.scopeId===scopeKey);
 const shadowed=scope ? (module==="projects"?scope.projectsShadowed:
   module==="placements"?scope.placementsShadowed:scope.electivesShadowed) : false;
 // Legacy placement eligibility is decided by the placement cell; showing
 // an editable academic scope toggle as eligibility would mislead students.
 const placementCellControlled=module==="placements";
 const url="/api/admin/features/"+encodeURIComponent(collegeId)+"/descendants";
 async function recheck(){
  if(!scope||busy)return;
  const revision=selectionRevision.current;
  setBusy(true);setMessage("");setStored(undefined);
  try{
   const params=new URLSearchParams({scopeType:scope.scopeType,scopeId:scope.scopeId,module});
   const response=await fetch(url+"?"+params,{cache:"no-store"});
   if(!response.ok)throw Error("Cannot load a verified stored rule.");
   const data=await response.json() as {stored:Observed};
   if(revision!==selectionRevision.current)return;
   setStored(data.stored);setChoice(!data.stored?"INHERIT":data.stored.enabled?"ON":"OFF");
   setLocked(data.stored?.locked??false);
  }catch(error){if(revision===selectionRevision.current)setMessage(error instanceof Error?error.message:"Load failed.");}
  finally{setBusy(false);}
 }
 async function save(){
  if(!scope||stored===undefined||busy||savingRef.current||shadowed||placementCellControlled)return;
  const revision=selectionRevision.current;
  const population=scope.studentsInScope;
  const changeLock=choice!=="INHERIT"&&locked!==(stored?.locked??false);
  const impact=choice==="OFF"?" This can remove access for affected learners.":"";
  const lockEffect=changeLock
    ? (locked?" Locking will prevent descendant overrides.":" Unlocking will permit descendant overrides.")
    : "";
  const warning="Apply "+(choice==="INHERIT"?"inherited":choice==="ON"?"enabled":"disabled")+
    " "+module+" to "+scope.label+" ("+population+" active "+(population===1?"learner":"learners")+")?"+
    impact+lockEffect;
  if(!(await askConfirm(warning))||revision!==selectionRevision.current||savingRef.current)return;
  savingRef.current=true;
  setBusy(true);setMessage("");
  try{
   const payload=choice==="INHERIT"?{scopeType:scope.scopeType,scopeId:scope.scopeId,module,action:"INHERIT",expected:stored}:
    {scopeType:scope.scopeType,scopeId:scope.scopeId,module,action:"SET",enabled:choice==="ON",locked,expected:stored};
   const response=await fetch(url,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
   if(!response.ok)throw Error(response.status===409
     ?"The module rule changed elsewhere. Recheck before saving."
     :"Could not save — please retry");
   const body=await response.json() as {stored:Observed};
   if(revision===selectionRevision.current){
    setStored(body.stored);setMessage("Module access updated");router.refresh();
   }
  }catch(error){if(revision===selectionRevision.current)setMessage(error instanceof Error?error.message:"Could not save — please retry");}
  finally{savingRef.current=false;setBusy(false);}
 }
 return <div className="mt-4 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
  <label className="grid min-w-0 w-full flex-1 gap-[6px] md:min-w-48 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic scope
   <Select className="min-h-11 min-[768px]:min-h-9" value={scopeKey}
    onChange={e=>selectScope(e.target.value)}>
    <option value="">Select Department, Program, Batch or Class</option>
    {scopes.map(item=><option key={item.scopeType+":"+item.scopeId} value={item.scopeType+":"+item.scopeId}>
      {item.scopeType==="COHORT"?"BATCH":item.scopeType} · {item.label}
    </option>)}
   </Select>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Module
   <Select className="min-h-11 min-[768px]:min-h-9" value={module}
    onChange={e=>{selectionRevision.current++;setModule(e.target.value as "projects"|"placements"|"electives");setStored(undefined);setMessage("");}}>
    <option value="projects">Projects</option><option value="placements">Placements</option><option value="electives">Electives</option>
   </Select>
  </label>
  <Button type="button" variant="secondary" className="min-h-11 w-full justify-center sm:w-auto min-[768px]:min-h-9" disabled={!scope||busy} onClick={()=>void recheck()}>{busy?"Rechecking…":"Recheck"}</Button>
  <Button type="button" variant="secondary" className="min-h-11 w-full justify-center sm:w-auto min-[768px]:min-h-9"
   disabled={busy} onClick={()=>{selectionRevision.current++;setStored(undefined);setMessage("");router.refresh();}}>Refresh</Button>
  <div className="flex w-full flex-wrap gap-2" role="group" aria-label="Academic scope hierarchy">
   <Button type="button" size="sm" variant="secondary" disabled={expanded||scopes.length===0} onClick={()=>setExpanded(true)}>Expand all</Button>
   <Button type="button" size="sm" variant="secondary" disabled={!expanded} onClick={()=>setExpanded(false)}>Collapse all</Button>
  </div>
  {expanded?<div className="max-h-64 w-full overflow-y-auto rounded-[var(--lms-control-radius)] border border-border bg-surface p-2" role="region" aria-label="Expanded academic scopes">
   {scopes.map(item=>{
    const key=item.scopeType+":"+item.scopeId;
    const effective=module==="projects"?item.projectsEffective:module==="placements"?item.placementsEffective:item.electivesEffective;
    const inherited=module==="projects"?item.projectsShadowed:module==="placements"?item.placementsShadowed:item.electivesShadowed;
    return <Button key={key} type="button" variant="ghost" size="sm" aria-pressed={scopeKey===key}
     className="mb-1 flex min-h-11 w-full min-w-0 justify-between gap-2 text-left"
     onClick={()=>selectScope(key)}>
      <span className="min-w-0 truncate">{item.label}</span>
      <span className="shrink-0 text-xs">{effective}{inherited?" · Ancestor locked":""}</span>
    </Button>;
   })}
  </div>:null}
  {stored!==undefined&&<>
   {placementCellControlled?<p className="w-full text-sm font-semibold text-body">Placement cell decides · Academic scope toggles do not decide learner placement eligibility.</p>:null}
   {shadowed?<p role="status" className="w-full text-sm text-warning-text">Effective rule: locked by a higher-level scope (global, organization, college or academic parent). Unlock the winning ancestor scope before editing this descendant.</p>:null}
   {scope?<p className="w-full text-xs text-muted-foreground">Selected scope: {scope.label} · {scope.studentsInScope} active learners. Changes may affect the entire selected scope.</p>:null}
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored rule
   <Select value={choice} disabled={busy||shadowed||placementCellControlled} className="min-h-11 min-[768px]:min-h-9" onChange={e=>setChoice(e.target.value)}>
    <option value="INHERIT">Inherit</option><option value="ON">On</option><option value="OFF">Off</option>
   </Select></label>
   <label className="flex min-h-11 min-[768px]:min-h-9 items-center gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"><Checkbox checked={locked} disabled={choice==="INHERIT"||busy||shadowed||placementCellControlled} onChange={e=>setLocked(e.target.checked)}/>Lock (Super Admin only)</label>
   <p className="w-full text-xs text-muted-foreground">Inherit removes the stored override and follows the nearest unlocked parent rule. On and Off store an explicit rule. A locked ancestor always wins over descendant settings.</p>
   <Button type="button" className="min-h-11 min-[768px]:min-h-9" disabled={busy||shadowed||placementCellControlled} onClick={()=>void save()}>Save rule</Button>
  </>}
  {message&&<p role="status" className="w-full text-sm text-body leading-[22px]">{message}</p>}
  {scopes.length>=500&&<p className="w-full text-sm text-warning-text leading-[22px]">This page displays up to 500 academic scopes. Open the next hierarchy page to edit later scopes.</p>}
  {dialog}
 </div>;
}
