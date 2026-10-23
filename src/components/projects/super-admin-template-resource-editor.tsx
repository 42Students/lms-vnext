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
function slug(value:string){
 return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64)||"resource";
}
function uniqueKey(name:string,used:readonly string[]){
 const base=slug(name),keys=new Set(used);let key=base,n=2;
 while(keys.has(key)){const suffix="-"+n++;key=base.slice(0,64-suffix.length)+suffix;}
 return key;
}
export function SuperAdminTemplateResourceEditor({templateId,title,summary,currentVersion,blueprint}:{
 templateId:string;title:string;summary:string|null;currentVersion:number;blueprint:ProjectTemplateBlueprint;
}){
 const {askConfirm,dialog}=useConfirmFlow();
 const {showToast}=useToast();
 const router=useRouter(),[open,setOpen]=useState(true),[pending,setPending]=useState(false),
 [version,setVersion]=useState(currentVersion),[rows,setRows]=useState(blueprint.resources),
 [error,setError]=useState(""),[message,setMessage]=useState("");
 const [rowErrors,setRowErrors]=useState<Record<number,string[]>>({});
 const [search,setSearch]=useState("");
 const [removed,setRemoved]=useState<{row:Resource;index:number}|null>(null);
 const visibleRows=rows.map((row,index)=>({row,index})).filter(({row,index})=>
  Boolean(rowErrors[index]?.length)||rows.length<=12||!search.trim()||[row.title,row.key,row.description,row.url,row.accessNotes].some(
   value=>String(value??"").toLowerCase().includes(search.trim().toLowerCase())));
 function remove(index:number){
  const row=rows[index];
  if(row===undefined)return;
  setRowErrors({});
  setRemoved({row,index});
  setRows(old=>old.filter((_,at)=>at!==index));
 }
 function undo(){
  if(!removed)return;
  setRowErrors({});
  setRows(old=>{const next=[...old];next.splice(Math.min(removed.index,next.length),0,removed.row);return next;});
  setRemoved(null);
 }
 const dirty=JSON.stringify(rows)!==JSON.stringify(blueprint.resources);
 const guard=useProjectEditorDiscardGuard(open,dirty,pending,()=>{
  setOpen(false);setRows(blueprint.resources);setError("");setRowErrors({});
 });
 function clearRowError(index:number){
  setRowErrors(current=>{
   if(!current[index])return current;
   const next={...current};delete next[index];return next;
  });
 }
 const change=(index:number,patch:Partial<Resource>)=>{
  clearRowError(index);
  setRows(old=>old.map((row,i)=>i===index?{...row,...patch}:row));
 };
 const changeOptional=(index:number,key:"url"|"description"|"accessNotes",value:string)=>{
  clearRowError(index);
  setRows(old=>old.map((row,i)=>{
   if(i!==index)return row;
   if(value)return {...row,[key]:value};
   const next={...row};
   delete next[key];
   return next;
  }));
 };
 const changeTitle=(index:number,titleValue:string)=>{
  clearRowError(index);
  setRows(old=>old.map((row,i)=>{
   if(i!==index)return row;
   const currentKey=row.key||"";
   const auto=!currentKey||currentKey===slug(row.title)||
    /^resource-\d+$/.test(currentKey);
   const used=old.filter((_,at)=>at!==index).map(item=>item.key);
   return {...row,title:titleValue,key:auto?uniqueKey(titleValue||"resource",used):currentKey};
  }));
 };
 function add(){
  setRowErrors({});
  if(rows.length>=200){setError("Maximum 200 resources in this template version.");return;}
  const key=uniqueKey("New resource",rows.map(r=>r.key));
  setRows(old=>[...old,{key,title:"",required:false,sequence:old.length,
   type:"LINK",status:"ACTIVE",pinned:false}]);
 }
 async function save(){
  const ordered=rows.map((row,i)=>({...row,sequence:i}));
  const issues:Record<number,string[]>={};
  const report=(index:number,message:string)=>{
   issues[index]=[...(issues[index]??[]),message];
  };
  for(const [index,row] of ordered.entries()){
   if(!row.title.trim())report(index,"Title required");
   if(row.url?.trim()){
    try{
     const url=new URL(row.url);
     if(!["http:","https:"].includes(url.protocol)||!url.hostname||url.username||url.password)
      throw new Error("unsafe");
    }catch{report(index,"Links must be ordinary http(s) URLs.");}
   }
  }
  const parsed=projectTemplateBlueprintSchema.safeParse({...blueprint,resources:ordered});
  let generalError="";
  if(!parsed.success){
   for(const issue of parsed.error.issues){
    const [section,index]=issue.path;
    if(section==="resources"&&typeof index==="number"){
     if(!(issues[index]??[]).includes(issue.message))report(index,issue.message);
    }else if(!generalError)generalError=issue.message;
   }
  }
  setRowErrors(issues);
  if(Object.keys(issues).length){
   setError("Fix the highlighted resource rows before saving."+(generalError?" "+generalError:""));
   return;
  }
  if(!parsed.success){setError(generalError||"Check the template resource fields.");return;}
  if(!(await askConfirm("Save resource changes as a new template version?")))return;
  setPending(true);setError("");setMessage("");
  try{
   const result=await projectMutation("/api/projects/templates/"+encodeURIComponent(templateId),"PATCH",{
    expectedVersion:version,title,summary:summary??undefined,
    blueprint:parsed.data,changeNote:"Updated template resources",
   }) as {version?:number;template?:{currentVersion:number}};
   setVersion(result.template?.currentVersion??result.version??version+1);
   setRows(ordered);setRemoved(null);setRowErrors({});setMessage("");setOpen(true);
   showToast({tone:"success",title:"Resources saved"});router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Failed to save resources");}
  finally{setPending(false);}
 }
 return <section className="min-w-0 space-y-3 border-b border-border pb-4">
  <div className="flex min-w-0 items-center justify-between gap-3">
   <h2 className="font-semibold text-[18px] text-[var(--lms-heading)]">Reading material and links copied into this template</h2>
   <Button type="button" variant="secondary" className="min-h-11 w-full sm:min-h-9 sm:w-auto" aria-expanded={open} disabled={pending} onClick={()=>{if(open)guard.requestClose();else setOpen(true);}}
    >
    {open?"Close editor":"Edit resources"}</Button>
  </div>
  {open?<div className="min-w-0 space-y-4 rounded-[8px] border border-border bg-surface p-4">
   <p className="text-sm text-muted-foreground">Use ordinary http(s) URLs only. javascript: and data: links cannot be saved; links to private files must use approved access and signed URLs.</p>
   {rows.length>12?<div className="min-w-0 space-y-1">
    <label className="text-sm font-semibold text-body" htmlFor="template-resource-search">Find a resource</label>
    <Input id="template-resource-search" type="search" value={search} onChange={event=>setSearch(event.target.value)}
      placeholder="Search resources by title or content" className="max-w-[420px]" />
    <p role="status" className="text-xs text-muted-foreground">Showing {visibleRows.length} of {rows.length} resources</p>
   </div>:null}
   {removed?<div className="flex flex-wrap items-center gap-2 border-b border-border pb-2 text-sm" role="status">
    <span>Removed {removed.row.title||"resource"} (unsaved).</span>
    <Button type="button" variant="link" onClick={undo} disabled={pending}>Undo remove</Button>
   </div>:null}
   {visibleRows.map(({row,index:i})=><details key={row.key+":"+i} className="min-w-0 border-b border-border py-2" open={rowErrors[i]?.length?true:undefined}>
    <summary className="flex min-h-11 cursor-pointer items-center gap-2 break-words text-sm font-semibold text-[var(--lms-heading)]">
      {row.title||"Untitled resource"} <span className="ml-auto text-xs font-normal text-muted-foreground">Resource {i+1}{rowErrors[i]?.length?" · Fix "+rowErrors[i].length+" error(s)":""}</span>
    </summary>
    {rowErrors[i]?.length?<ul role="alert" className="list-disc space-y-1 px-5 py-2 text-xs text-danger-text">
      {rowErrors[i].map((issue,index)=><li key={index}>{issue}</li>)}
    </ul>:null}
    <fieldset disabled={pending} className="grid min-w-0 gap-3 pb-4 pt-3 md:grid-cols-2 md:gap-3">
    <legend className="sr-only">Edit {row.title||"resource "+(i+1)}</legend>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Key<Input value={row.key} maxLength={64}
      onChange={e=>change(i,{key:e.target.value})} placeholder={slug(row.title)}
      className={cls}/><span className="mt-1 block text-xs font-normal text-muted-foreground">
       Generated key: {uniqueKey(row.title||"resource",rows.filter((_,at)=>at!==i).map(item=>item.key))}
      </span></label>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Title *<Input value={row.title} required maxLength={200} aria-invalid={Boolean(rowErrors[i]?.length)} placeholder="e.g. Project brief"
      onChange={e=>changeTitle(i,e.target.value)} className={cls}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Type<Select value={row.type??"LINK"}
      onChange={e=>change(i,{type:e.target.value as NonNullable<Resource["type"]>})} className={cls}>
      {(["LINK","PDF","DOCUMENT","SLIDES","VIDEO","FILE"] as const).map(v=><option key={v} value={v}>
       {({LINK:"Link",PDF:"PDF",DOCUMENT:"Document",SLIDES:"Slides",VIDEO:"Video",FILE:"File"} as const)[v]}
      </option>)}
    </Select></label>
    <label className="text-[var(--lms-font-sm)] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Status<Select value={row.status??"ACTIVE"}
      onChange={e=>change(i,{status:e.target.value as NonNullable<Resource["status"]>})} className={cls}>
      {["ACTIVE","DRAFT","ARCHIVED"].map(v=><option key={v} value={v}>{v}</option>)}
    </Select></label>
    <label className="text-[var(--lms-font-sm)] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">URL (for a Link)<Input value={row.url??""}
      onChange={e=>changeOptional(i,"url",e.target.value)}
      placeholder="https://example.com/resource" className={cls}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">Description
     <Textarea value={row.description??""} onChange={e=>changeOptional(i,"description",e.target.value)}
      placeholder="What this resource is for" className={cls+" min-h-20"}/></label>
    <label className="text-[var(--lms-font-sm)] font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">Access notes (optional)
     <Input maxLength={2000} value={row.accessNotes??""}
      onChange={e=>changeOptional(i,"accessNotes",e.target.value)}
      placeholder="e.g. Requires college email to view" className={cls}/></label>
    <label className="flex items-center gap-2 text-xs font-semibold text-body"><Checkbox className="size-5"
      checked={row.pinned??false} onChange={e=>change(i,{pinned:e.target.checked})}/>Pinned</label>
    <label className="flex items-center gap-2 text-xs font-semibold text-body"><Checkbox className="size-5"
      checked={row.required} onChange={e=>change(i,{required:e.target.checked})}/>Required</label>
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:col-span-2">
      <Button type="button" variant="secondary" aria-label={"Move "+(row.title||"resource")+" up"} disabled={i===0} onClick={()=>{setRowErrors({});setRows(r=>{const n=[...r];const previous=n[i-1],current=n[i];if(previous===undefined||current===undefined)return r;n[i-1]=current;n[i]=previous;return n;});}}
       className="min-h-11 w-full text-xs sm:min-h-9 sm:w-auto">Move up</Button>
      <Button type="button" variant="secondary" aria-label={"Move "+(row.title||"resource")+" down"} disabled={i===rows.length-1} onClick={()=>{setRowErrors({});setRows(r=>{const n=[...r];const next=n[i+1],current=n[i];if(next===undefined||current===undefined)return r;n[i+1]=current;n[i]=next;return n;});}}
       className="min-h-11 w-full text-xs sm:min-h-9 sm:w-auto">Move down</Button>
      <Button type="button" variant="danger" aria-label={"Remove "+(row.title||"resource")} onClick={()=>remove(i)}
       className="min-h-11 w-full text-xs sm:min-h-9 sm:w-auto">Remove</Button>
    </div>
    </fieldset>
   </details>)}
   <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="secondary" disabled={pending||rows.length>=200} className="min-h-11 w-full border-dashed sm:min-h-9 sm:w-auto" onClick={add} >Add resource</Button>
    <Button type="button" variant="primary" className="min-h-11 w-full sm:min-h-9 sm:w-auto" disabled={pending} onClick={()=>void save()}
     >
     {pending?"Saving…":"Save resources"}</Button>
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
