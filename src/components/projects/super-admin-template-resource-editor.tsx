"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {projectTemplateBlueprintSchema,type ProjectTemplateBlueprint} from "@/modules/projects/validation";
import {projectMutation} from "./project-api";
type Resource=ProjectTemplateBlueprint["resources"][number];
const cls="mt-1 w-full";
export function SuperAdminTemplateResourceEditor({templateId,title,summary,currentVersion,blueprint}:{
 templateId:string;title:string;summary:string|null;currentVersion:number;blueprint:ProjectTemplateBlueprint;
}){
 const router=useRouter(),[open,setOpen]=useState(false),[pending,setPending]=useState(false),
 [version,setVersion]=useState(currentVersion),[rows,setRows]=useState(blueprint.resources),
 [error,setError]=useState(""),[message,setMessage]=useState("");
 const change=(index:number,patch:Partial<Resource>)=>setRows(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 function add(){
  const keys=new Set(rows.map(r=>r.key));
  let n=1;while(keys.has("resource-"+n))n++;
  setRows(old=>[...old,{key:"resource-"+n,title:"New resource",required:false,sequence:old.length,
   type:"LINK",status:"ACTIVE",pinned:false}]);
 }
 async function save(){
  const ordered=rows.map((row,i)=>({...row,sequence:i}));
  const parsed=projectTemplateBlueprintSchema.safeParse({...blueprint,resources:ordered});
  if(!parsed.success){setError(parsed.error.issues[0]?.message??"Invalid resources");return;}
  if(!window.confirm("Save resource changes as a new template version?"))return;
  setPending(true);setError("");setMessage("");
  try{
   const result=await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"PATCH",{
    expectedVersion:version,title,summary:summary??undefined,
    blueprint:parsed.data,changeNote:"Updated template resources",
   }) as {version?:number;template?:{currentVersion:number}};
   setVersion(result.template?.currentVersion??result.version??version+1);
   setMessage("Template resources saved.");setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not save resources");}
  finally{setPending(false);}
 }
 return <section className="space-y-3 border-b border-border pb-5">
  <div className="flex items-center justify-between">
   <h2 className="font-semibold">Template resources</h2>
   <Button type="button" variant="secondary" onClick={()=>setOpen(v=>!v)}
    className="">
    {open?"Close editor":"Edit resources"}</Button>
  </div>
  {open?<div className="space-y-4">
   {rows.map((row,i)=><fieldset key={row.key} className="grid gap-3 rounded-[var(--lms-canvas-radius)] border border-border p-3 sm:grid-cols-2">
    <legend className="px-2 text-sm font-semibold">Resource {i+1}</legend>
    <label className="text-xs font-semibold">Key<Input value={row.key} maxLength={64}
      onChange={e=>change(i,{key:e.target.value})} className={cls}/></label>
    <label className="text-xs font-semibold">Title<Input value={row.title} maxLength={200}
      onChange={e=>change(i,{title:e.target.value})} className={cls}/></label>
    <label className="text-xs font-semibold">Type<Select value={row.type??"LINK"}
      onChange={e=>change(i,{type:e.target.value as Resource["type"]})} className={cls}>
      {["LINK","PDF","DOCUMENT","SLIDES","VIDEO","FILE"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
    <label className="text-xs font-semibold">Status<Select value={row.status??"ACTIVE"}
      onChange={e=>change(i,{status:e.target.value as Resource["status"]})} className={cls}>
      {["ACTIVE","DRAFT","ARCHIVED"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
    <label className="text-xs font-semibold sm:col-span-2">URL<Input value={row.url??""}
      onChange={e=>change(i,{url:e.target.value||undefined})}
      placeholder="https://" className={cls}/></label>
    <label className="text-xs font-semibold sm:col-span-2">Description
     <Textarea value={row.description??""} onChange={e=>change(i,{description:e.target.value||undefined})}
      className={cls+" min-h-20"}/></label>
    <label className="text-xs font-semibold sm:col-span-2">Access notes
     <Textarea maxLength={2000} value={row.accessNotes??""}
      onChange={e=>change(i,{accessNotes:e.target.value||undefined})}
      className={cls+" min-h-16"}/></label>
    <label className="flex items-center gap-2 text-xs font-semibold"><Checkbox className="size-5"
      checked={row.required} onChange={e=>change(i,{required:e.target.checked})}/>Required</label>
    <label className="flex items-center gap-2 text-xs font-semibold"><Checkbox className="size-5"
      checked={row.pinned??false} onChange={e=>change(i,{pinned:e.target.checked})}/>Pinned</label>
    <div className="flex flex-wrap gap-2 sm:col-span-2">
      <Button type="button" variant="secondary" disabled={i===0} onClick={()=>setRows(r=>{const n=[...r];[n[i-1],n[i]]=[n[i],n[i-1]];return n;})}
       className="text-xs">Move up</Button>
      <Button type="button" variant="secondary" disabled={i===rows.length-1} onClick={()=>setRows(r=>{const n=[...r];[n[i+1],n[i]]=[n[i],n[i+1]];return n;})}
       className="text-xs">Move down</Button>
      <Button type="button" variant="danger" onClick={()=>setRows(r=>r.filter((_,at)=>at!==i))}
       className="text-xs">Remove</Button>
    </div>
   </fieldset>)}
   <div className="flex gap-3">
    <Button type="button" variant="secondary" onClick={add} className="">Add resource</Button>
    <Button type="button" variant="primary" disabled={pending} onClick={()=>void save()}
     className="">
     {pending?"Saving…":"Save as new version"}</Button>
   </div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm text-success">{message}</p>:null}
 </section>;
}
