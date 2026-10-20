"use client";
import { Disclosure } from "@/components/ui/disclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useEffect,useState} from "react";
import {useRouter,useSearchParams} from "next/navigation";
type SavedView={name:string;seasonId:string;jobId:string;batchId?:string;branchId?:string;sort?:string;outcome?:string;q?:string;group?:string;state?:string;days?:string;companyId?:string;workMode?:string;payCategory?:string};
const keyFor=(path:string,collegeId:string,userId:string)=>"lms.tpo.report-view."+collegeId+"."+userId+"."+path.replace(/[^a-z0-9/-]/gi,"");
const clean=(value:unknown):SavedView[]=>Array.isArray(value)?value.flatMap(item=>
 item&&typeof item==="object"&&typeof item.name==="string"&&
 typeof item.seasonId==="string"&&typeof item.jobId==="string"?
 [{name:item.name.slice(0,50),seasonId:item.seasonId.slice(0,80),jobId:item.jobId.slice(0,80),batchId:typeof item.batchId==="string"?item.batchId.slice(0,80):"",branchId:typeof item.branchId==="string"?item.branchId.slice(0,80):"",sort:typeof item.sort==="string"?item.sort.slice(0,30):"",outcome:typeof item.outcome==="string"?item.outcome.slice(0,30):"",q:typeof item.q==="string"?item.q.slice(0,100):"",group:typeof item.group==="string"?item.group.slice(0,30):"",state:typeof item.state==="string"?item.state.slice(0,30):"",days:typeof item.days==="string"?item.days.slice(0,5):"",companyId:typeof item.companyId==="string"?item.companyId.slice(0,80):"",workMode:typeof item.workMode==="string"?item.workMode.slice(0,20):"",payCategory:typeof item.payCategory==="string"?item.payCategory.slice(0,30):""}]:[]).slice(0,12):[];
export function TpoReportSavedFilters({path,collegeId,userId}:{path:string;collegeId:string;userId:string}){
 const router=useRouter(),params=useSearchParams();
 const [views,setViews]=useState<SavedView[]>([]);
 const [name,setName]=useState(""),[picked,setPicked]=useState("");
 const [message,setMessage]=useState("");
 useEffect(()=>{
  let live=true;
  void Promise.resolve().then(()=>{
   if(!live)return;
   setPicked("");
   try{const stored=localStorage.getItem(keyFor(path,collegeId,userId));setViews(stored?clean(JSON.parse(stored)):[]);}catch{setViews([]);setMessage("Browser storage is unavailable.");}
  });
  return ()=>{live=false;};
 },[path,collegeId,userId]);
 function persist(next:SavedView[]){
  try{localStorage.setItem(keyFor(path,collegeId,userId),JSON.stringify(next));setViews(next);return true;}
  catch{setMessage("Browser storage is unavailable; saved views cannot be kept.");return false;}
 }
 function save(){
  const label=name.trim();
  if(views.some(item=>item.name.toLowerCase()===label.toLowerCase()&&item.name!==label)){
   setMessage("A view already uses that name.");return;
  }
  if(!label||label.length>50){setMessage("Choose a name up to 50 characters.");return;}
  if(views.length>=12&&!views.some(item=>item.name===label)){setMessage("Up to 12 saved filters per report.");return;}
  const next=views.filter(item=>item.name!==label);
  next.push({name:label,seasonId:params.get("seasonId")??"",jobId:params.get("jobId")??"",batchId:params.get("batchId")??"",branchId:params.get("branchId")??"",sort:params.get("sort")??"",outcome:params.get("outcome")??"",q:params.get("q")??"",group:params.get("group")??"",state:params.get("state")??"",days:params.get("days")??"",companyId:params.get("companyId")??"",workMode:params.get("workMode")??"",payCategory:params.get("payCategory")??""});
  if(persist(next)){setPicked(label);setName("");setMessage("Saved filters for this report.");}
 }
 function apply(){
  const selected=views.find(v=>v.name===picked);if(!selected)return;
  const next=new URLSearchParams();
  if(selected.seasonId)next.set("seasonId",selected.seasonId);
  if(selected.jobId)next.set("jobId",selected.jobId);
  for(const field of ["batchId","branchId","sort","outcome","q","group","state","days","companyId","workMode","payCategory"] as const){
   if(selected[field])next.set(field,selected[field]);
  }
  router.push(path+(next.size?"?"+next:""));
  setMessage("Saved filters applied.");
 }
 function remove(){
  if(!picked)return;
  if(persist(views.filter(v=>v.name!==picked))){setPicked("");setMessage("Saved filter removed.");}
 }
 return <Disclosure title={`Saved filters (${views.length}/12)`} className="min-w-0 border-t border-border pt-4 print:hidden">
  <p className="mt-2 text-xs text-muted-foreground">Save this report&apos;s active filters in this browser for your account. Nothing is sent to other users or devices.</p>
  <div className="mt-3 flex flex-wrap items-end gap-2">
   <label className="grid min-w-0 w-full flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-40 md:w-auto">Name this view
    <Input className="min-h-11 md:min-h-9" value={name} onChange={e=>setName(e.target.value)} maxLength={50}
      placeholder="e.g. Current season"/>
   </label>
   <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={save} disabled={!name.trim()} >Save current</Button>
  </div>
  <div className="mt-3 flex flex-wrap items-end gap-2">
   <label className="grid min-w-0 w-full flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-40 md:w-auto">Choose saved view
    <Select className="min-h-11 md:min-h-9" value={picked} disabled={views.length===0} onChange={e=>{setPicked(e.target.value);setMessage("");}}
     >
     <option value="">Select view</option>
     {views.map(v=><option key={v.name} value={v.name}>{v.name}</option>)}
    </Select>
   </label>
   <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" disabled={!picked} onClick={apply} >Apply</Button>
   <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" disabled={!picked} onClick={remove} >Delete</Button>
  </div>
  {message?<InlineNotice tone={["Saved filters for this report.","Saved filters applied.","Saved filter removed."].includes(message)?"success":"error"} message={message}/>:null}
 </Disclosure>;
}
