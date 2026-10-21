"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
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
 const {askConfirm,dialog}=useConfirmFlow();
 const {showToast}=useToast();
 const router=useRouter(),[open,setOpen]=useState(false),[pending,setPending]=useState(false),
 [version,setVersion]=useState(currentVersion),[rows,setRows]=useState(blueprint.resources),
 [error,setError]=useState(""),[message,setMessage]=useState("");
 const dirty=JSON.stringify(rows)!==JSON.stringify(blueprint.resources);
 const guard=useProjectEditorDiscardGuard(open,dirty,pending,()=>{
  setOpen(false);setRows(blueprint.resources);setError("");
 });
 const change=(index:number,patch:Partial<Resource>)=>setRows(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 function add(){
  if(rows.length>=200){setError("Maximum 200 resources in this template version.");return;}
  const keys=new Set(rows.map(r=>r.key));
  let n=1;while(keys.has("resource-"+n))n++;
  setRows(old=>[...old,{key:"resource-"+n,title:"New resource",required:false,sequence:old.length,
   type:"LINK",status:"ACTIVE",pinned:false}]);
 }
 async function save(){
  const ordered=rows.map((row,i)=>({...row,sequence:i}));
  for(let index=0;index<ordered.length;index++){
   const row=ordered[index]!;
   if(!row.title.trim()){setError("Item "+(index+1)+": Title required");return;}
   if(row.url?.trim()){
    try{
     const url=new URL(row.url);
     if(!["http:","https:"].includes(url.protocol)||!url.hostname||url.username||url.password)
      throw new Error("unsafe");
    }catch{setError("Item "+(index+1)+": Links must be ordinary http(s) URLs.");return;}
   }
  }
  const parsed=projectTemplateBlueprintSchema.safeParse({...blueprint,resources:ordered});
  if(!parsed.success){
   const issue=parsed.error.issues[0];
   const index=issue?.path.find(part=>typeof part==="number");
   setError((typeof index==="number"?"Item "+(index+1)+": ":"")+(issue?.message??"Invalid resources"));
   return;
  }
  if(!(await askConfirm("Save resource changes as a new template version?")))return;
  setPending(true);setError("");setMessage("");
  try{
   const result=await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"PATCH",{
    expectedVersion:version,title,summary:summary??undefined,
    blueprint:parsed.data,changeNote:"Updated template resources",
   }) as {version?:number;template?:{currentVersion:number}};
   setVersion(result.template?.currentVersion??result.version??version+1);
   setRows(ordered);setMessage("");setOpen(false);
   showToast({tone:"success",title:"Resources saved"});router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Failed to save resources");}
  finally{setPending(false);}
 }
 return <section className="min-w-0 space-y-3 border-b border-border pb-4">
  <div className="flex min-w-0 justify-end">
   <Button type="button" variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto" aria-expanded={open} disabled={pending} onClick={()=>{if(open)guard.requestClose();else setOpen(true);}}
    >
    {open?"Close editor":"Edit resources"}</Button>
  </div>
  {open?<div className="min-w-0 space-y-4">
   <p className="text-sm text-muted-foreground">Links must be ordinary http(s) URLs — the server rejects javascript:/data: URLs on save.</p>
   {rows.map((row,i)=><fieldset key={row.key} disabled={pending} className="grid min-w-0 gap-3 border-b border-border py-4 md:grid-cols-2">
    <legend className="px-2 text-[var(--lms-font-sm)] font-semibold text-foreground">Resource {i+1}</legend>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Key<Input value={row.key} maxLength={64}
      onChange={e=>change(i,{key:e.target.value})} className={cls}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Title<Input value={row.title} maxLength={200}
      onChange={e=>change(i,{title:e.target.value})} className={cls}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Type<Select value={row.type??"LINK"}
      onChange={e=>change(i,{type:e.target.value as Resource["type"]})} className={cls}>
      {["LINK","PDF","DOCUMENT","SLIDES","VIDEO","FILE"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Status<Select value={row.status??"ACTIVE"}
      onChange={e=>change(i,{status:e.target.value as Resource["status"]})} className={cls}>
      {["ACTIVE","DRAFT","ARCHIVED"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
    <label className="text-[var(--lms-font-sm)] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">URL<Input value={row.url??""}
      onChange={e=>change(i,{url:e.target.value||undefined})}
      placeholder="https://" className={cls}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">Description
     <Textarea value={row.description??""} onChange={e=>change(i,{description:e.target.value||undefined})}
      className={cls+" min-h-20"}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">Access notes
     <Textarea maxLength={2000} value={row.accessNotes??""}
      onChange={e=>change(i,{accessNotes:e.target.value||undefined})}
      className={cls+" min-h-16"}/></label>
    <label className="flex items-center gap-2 text-xs font-semibold text-body"><Checkbox className="size-5"
      checked={row.required} onChange={e=>change(i,{required:e.target.checked})}/>Required</label>
    <label className="flex items-center gap-2 text-xs font-semibold text-body"><Checkbox className="size-5"
      checked={row.pinned??false} onChange={e=>change(i,{pinned:e.target.checked})}/>Pinned</label>
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:col-span-2">
      <Button type="button" variant="secondary" disabled={i===0} onClick={()=>setRows(r=>{const n=[...r];[n[i-1],n[i]]=[n[i],n[i-1]];return n;})}
       className="min-h-11 w-full text-xs sm:min-h-9 sm:w-auto">Move up</Button>
      <Button type="button" variant="secondary" disabled={i===rows.length-1} onClick={()=>setRows(r=>{const n=[...r];[n[i+1],n[i]]=[n[i],n[i+1]];return n;})}
       className="min-h-11 w-full text-xs sm:min-h-9 sm:w-auto">Move down</Button>
      <Button type="button" variant="danger" onClick={()=>setRows(r=>r.filter((_,at)=>at!==i))}
       className="min-h-11 w-full text-xs sm:min-h-9 sm:w-auto">Remove</Button>
    </div>
   </fieldset>)}
   <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="secondary" disabled={pending||rows.length>=200} className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={add} >Add resource</Button>
    <Button type="button" variant="primary" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={pending} onClick={()=>void save()}
     >
     {pending?"Saving…":"Save as new version"}</Button>
   </div>
  </div>:null}
  {error?<Banner tone="error">{error}</Banner>:null}
  {message?<Banner tone="success">{message}</Banner>:null}
  {dialog}
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
    title="Discard resource changes?" description="You have unsaved changes. Leave this editor and discard them?"
    confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
 </section>;
}
