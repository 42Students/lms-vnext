"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {legacyResourceKinds,legacyResourceKind,makeResourceKey,
 type ProjectResourceLibraryRow} from "@/modules/projects/project-resource-library-model";

type Persisted={
 id:string;title:string;description:string|null;url:string|null;required:boolean;
 pinned:boolean;status:string;visibility:string;resourceType:string;
 accessNotes:string|null;legacyResourceKey:string|null;legacyResourceKind:string|null;
 templateKey:string|null;sequence:number;
};
type Draft=ProjectResourceLibraryRow&{localId:string};
const fromResource=(row:Persisted):Draft=>({
 localId:row.id,id:row.id,key:row.legacyResourceKey||row.templateKey||makeResourceKey(row.title),
 title:row.title,legacyKind:legacyResourceKind(row.legacyResourceKind,row.resourceType),
 url:row.url,description:row.description,accessNotes:row.accessNotes,
 required:row.required,pinned:row.pinned,
 visibility:row.visibility==="MENTOR_ONLY"?"MENTOR_ONLY":"TEAM",
 status:row.status==="ARCHIVED"?"ARCHIVED":row.status==="DRAFT"?"DRAFT":"ACTIVE",
});
const httpUrl=(value:string|null)=>!value||(()=>{
 try{return ["http:","https:"].includes(new URL(value).protocol);}
 catch{return false;}
})();
const rowData=(row:Draft):ProjectResourceLibraryRow=>{
 const {localId:unused,...saved}=row;
 void unused;
 return saved;
};

/** Mirrors the legacy repeating resource plan with one scoped transaction.
 * Existing resources, including archived rows, are always present in the CAS.
 */
export function ProjectResourceLibraryEditor({projectId,token,resources}:{
 projectId:string;token:string;resources:readonly Persisted[];
}){
 const router=useRouter(),{showToast}=useToast();
 const baseline=()=>[...resources].sort((a,b)=>a.sequence-b.sequence).map(fromResource);
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState<Draft[]>(baseline);
 const [removedNew,setRemovedNew]=useState<{row:Draft;index:number}[]>([]);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const newCount=useRef(0),inFlight=useRef(false);
 const initial=baseline();
 const dirty=JSON.stringify(draft.map(rowData))!==JSON.stringify(initial.map(rowData))||
  removedNew.length>0;
 const overLimit=initial.length>500;
 const shown=draft.filter(row=>row.status!=="ARCHIVED");
 const newlyArchived=draft.filter(row=>row.id&&row.status==="ARCHIVED"&&
  initial.some(source=>source.id===row.id&&source.status!=="ARCHIVED"));
 const invalid=shown.some(row=>!row.title.trim()||!row.key.trim()||
  !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.key)||!httpUrl(row.url)||
  row.title.length>200||(row.description?.length??0)>4000||
  (row.accessNotes?.length??0)>4000)||
  new Set(draft.map(row=>row.key.toLowerCase())).size!==draft.length;
 function reset(){
  setDraft(baseline());setRemovedNew([]);setOpen(false);setError("");
 }
 const guard=useProjectEditorDiscardGuard(open,dirty,pending,reset);
 function edit<K extends keyof Draft>(localId:string,field:K,value:Draft[K]){
  setDraft(old=>old.map(row=>row.localId===localId?{...row,[field]:value}:row));
 }
 function changeTitle(row:Draft,title:string){
  setDraft(old=>old.map(item=>{
   if(item.localId!==row.localId)return item;
   const source=initial.find(saved=>saved.id===row.id);
   const key=!source&&(item.key.startsWith("resource-new-")||
    item.key===makeResourceKey(item.title))?makeResourceKey(title):item.key;
   return {...item,title,key};
  }));
 }
 function move(index:number,offset:-1|1){
  setDraft(old=>{
   const activeIndices=old.map((item,i)=>item.status==="ARCHIVED"?-1:i).filter(i=>i>=0);
   const from=activeIndices[index],to=activeIndices[index+offset];
   if(from===undefined||to===undefined)return old;
   const next=[...old];[next[from],next[to]]=[next[to]!,next[from]!];
   return next;
  });
 }
 function remove(row:Draft){
  if(row.id){
   edit(row.localId,"status","ARCHIVED");
  }else{
   setDraft(old=>{
    const index=old.findIndex(item=>item.localId===row.localId);
    if(index<0)return old;
    setRemovedNew(previous=>[...previous,{row,index}]);
    return old.filter(item=>item.localId!==row.localId);
   });
  }
 }
 function undoRemove(row:Draft){
  if(row.id){
   const source=initial.find(item=>item.id===row.id);
   edit(row.localId,"status",source?.status==="DRAFT"?"DRAFT":"ACTIVE");
  }else{
   const match=removedNew.find(item=>item.row.localId===row.localId);
   if(!match)return;
   setDraft(previous=>{
    const next=[...previous];
    next.splice(Math.min(match.index,next.length),0,match.row);
    return next;
   });
   setRemovedNew(previous=>previous.filter(item=>item.row.localId!==row.localId));
  }
 }
 function add(){
  if(draft.length>=500)return;
  const localId="resource-new-"+(++newCount.current);
  setDraft(previous=>[...previous,{
   localId,id:null,key:localId,title:"",legacyKind:"Link",
   url:null,description:null,accessNotes:null,required:false,pinned:false,
   visibility:"TEAM",status:"ACTIVE",
  }]);
 }
 function undoRow(row:Draft){
  const source=initial.find(item=>item.id===row.id);
  if(source)setDraft(previous=>previous.map(item=>item.localId===row.localId?source:item));
 }
 async function save(){
  if(inFlight.current||pending||overLimit)return;
  if(!dirty){showToast({tone:"info",title:"No changes to save"});return;}
  const untitled=shown.findIndex(row=>!row.title.trim());
  if(untitled>=0){setError("Item "+(untitled+1)+": Title required");return;}
  if(invalid){setError("Check resource titles, keys and HTTP(S) URLs before saving.");return;}
  if(draft.length>500){setError("A resource library can contain at most 500 rows.");return;}
  inFlight.current=true;setPending(true);setError("");
  try{
   await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/resources/library",
    "PATCH",{expectedToken:token,rows:draft.map(rowData)});
   showToast({tone:"success",title:"Resources updated"});
   setOpen(false);setRemovedNew([]);router.refresh();
  }catch(caught){
   const detail=caught instanceof Error?caught.message:"The resource section may have changed.";
   setError("Failed to update resources. "+detail);
   showToast({tone:"error",title:"Failed to update resources",
    description:"Reload the resource library before retrying a stale save."});
  }finally{inFlight.current=false;setPending(false);}
 }
 const metrics=[
  ["Resources",shown.length],["Links",shown.filter(row=>row.legacyKind==="Link").length],
  ["Files & media",shown.filter(row=>row.legacyKind!=="Link").length],
  ["With access notes",shown.filter(row=>Boolean(row.accessNotes?.trim())).length],
 ] as const;
 return <section aria-label="Resource library" className="min-w-0 space-y-4 border-b border-border pb-5">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div>
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Project references</p>
    <h2 className="mt-1 text-lg font-semibold text-foreground">Resource library</h2>
    <h3 className="mt-1 text-base font-semibold text-foreground">
     Keep everything the team needs in one curated place
    </h3>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-body">
     Add only useful project references, label them clearly, and include access notes
     when a link or file needs a college account, permission request, or other prerequisite.
    </p>
   </div>
   <Button type="button" size="sm" variant="secondary" aria-expanded={open}
    disabled={pending||overLimit}
    onClick={()=>{if(open)guard.requestClose();else{
     setDraft(baseline());setRemovedNew([]);setError("");setOpen(true);
    }}}>{open?"Close resource library":"Edit resource library"}</Button>
  </div>
  <dl aria-label="Resource library summary"
   className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
   {metrics.map(([name,count])=><div key={name} className="border-b border-border px-3 py-3">
    <dt className="text-xs text-body">{name}</dt>
    <dd className="mt-1 text-lg font-semibold tabular-nums">{count}</dd>
   </div>)}
  </dl>
  {overLimit?<p role="alert" className="text-sm text-warning-text">
   This workspace has more than 500 resources. Use the individual resource editor
   to avoid losing historic records in a bulk save.
  </p>:null}
  {open?<div className="space-y-4">
   <p className="text-sm text-body">
    Make changes, reorder, remove and Undo before saving. Save resource library applies
    one atomic update. Archived resources stay recoverable.
   </p>
   {!shown.length?<p className="border-y border-border py-3 text-sm text-body">
    No resources yet. Add only the references the team will actually use.
   </p>:null}
   {shown.map((row,index)=><fieldset key={row.localId} disabled={pending}
    className="min-w-0 space-y-3 border-b border-border pb-4">
    <legend className="text-sm font-semibold text-foreground">
     {row.title||"Resource "+(index+1)}
    </legend>
    <div className="flex flex-wrap gap-2">
     <Button size="sm" variant="secondary" disabled={pending||index===0}
      onClick={()=>move(index,-1)}>Up</Button>
     <Button size="sm" variant="secondary" disabled={pending||index===shown.length-1}
      onClick={()=>move(index,1)}>Down</Button>
     <Button size="sm" variant="ghost" disabled={pending||!row.id}
      onClick={()=>undoRow(row)}>Undo row</Button>
     <Button size="sm" variant="ghost" disabled={pending}
      onClick={()=>remove(row)}>Remove</Button>
    </div>
    <div className="grid min-w-0 gap-3 md:grid-cols-2">
     <label className="text-xs font-semibold text-body">Key
      <Input className="mt-1" maxLength={120} required
       disabled={Boolean(row.id&&resources.some(resource=>resource.id===row.id&&
        (resource.legacyResourceKey||resource.templateKey)))}
       value={row.key} onChange={event=>edit(row.localId,"key",event.target.value)}/>
      {row.id?<span className="mt-1 block text-xs font-normal text-body">
       Existing resource keys are preserved for linked references.
      </span>:<span className="mt-1 block text-xs font-normal text-muted-foreground">
       Optional: leave the generated key as is or enter your own. Auto-generated from title if left blank.
       {row.title?" Preview: "+makeResourceKey(row.title):""}
      </span>}
     </label>
     <label className="text-xs font-semibold text-body">Type
      <Select className="mt-1" value={row.legacyKind}
       onChange={event=>edit(row.localId,"legacyKind",
        event.target.value as Draft["legacyKind"])}>
       {legacyResourceKinds.map(kind=><option key={kind} value={kind}>{kind}</option>)}
      </Select>
     </label>
     <label className="text-xs font-semibold text-body">Title <span aria-hidden="true" className="text-error">*</span>
      <Input required className="mt-1" maxLength={200} aria-invalid={!row.title.trim()}
       value={row.title} onChange={event=>changeTitle(row,event.target.value)}/>
      {!row.title.trim()?<span role="alert" className="mt-1 block text-xs text-error">
       Item {index+1}: Title required</span>:null}
     </label>
     <label className="text-xs font-semibold text-body">URL (for a Link)
      <Input className="mt-1" type="url" maxLength={2048}
       aria-invalid={!httpUrl(row.url)} value={row.url??""} placeholder="https://..."
       onChange={event=>edit(row.localId,"url",event.target.value||null)}/>
     </label>
     <label className="text-xs font-semibold text-body md:col-span-2">Access notes
      <Textarea className="mt-1" rows={2} maxLength={4000} value={row.accessNotes??""}
       placeholder="e.g. Requires college email to view"
       onChange={event=>edit(row.localId,"accessNotes",event.target.value||null)}/>
     </label>
     <label className="text-xs font-semibold text-body md:col-span-2">Description
      <Textarea className="mt-1" rows={2} maxLength={4000} value={row.description??""}
       onChange={event=>edit(row.localId,"description",event.target.value||null)}/>
     </label>
     <label className="text-xs font-semibold text-body">Status
      <Select className="mt-1" value={row.status}
       onChange={event=>edit(row.localId,"status",event.target.value as "ACTIVE"|"DRAFT")}>
       <option value="ACTIVE">Active</option><option value="DRAFT">Draft</option>
      </Select>
     </label>
     <label className="text-xs font-semibold text-body">Visible to
      <Select className="mt-1" value={row.visibility}
       onChange={event=>edit(row.localId,"visibility",
        event.target.value as "TEAM"|"MENTOR_ONLY")}>
       <option value="TEAM">Everyone</option>
       <option value="MENTOR_ONLY">Mentors only</option>
      </Select>
     </label>
     <label className="flex items-center gap-2 text-xs font-semibold text-body">
      <Checkbox checked={row.pinned}
       onChange={event=>edit(row.localId,"pinned",event.target.checked)}/> Pinned
     </label>
     <label className="flex items-center gap-2 text-xs font-semibold text-body">
      <Checkbox checked={row.required}
       onChange={event=>edit(row.localId,"required",event.target.checked)}/> Required resource
     </label>
    </div>
   </fieldset>)}
   {newlyArchived.length+removedNew.length>0?<div className="space-y-2 border-y border-border py-3">
    {[...newlyArchived,...removedNew.map(item=>item.row)].map(row=>
     <div key={row.localId} className="flex flex-wrap items-center gap-2 text-xs text-body">
      <span>Item removed from this unsaved form.</span>
      <Button type="button" variant="ghost" size="sm" disabled={pending}
       onClick={()=>undoRemove(row)}>Undo remove</Button>
      <strong>{row.title||"Untitled resource"}</strong>
     </div>)}
   </div>:null}
   <div className="flex flex-wrap items-center gap-3">
    <Button type="button" size="sm" variant="secondary"
     disabled={pending||draft.length>=500} onClick={add}>Add resource</Button>
    <span className="text-xs text-body">{draft.length}/500 rows</span>
   </div>
   {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
   <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
    <Button type="button" loading={pending} disabled={pending||draft.length>500}
     onClick={()=>void save()}>{pending?"Saving…":"Save resource library"}</Button>
    <Button type="button" variant="secondary" disabled={pending||!dirty}
     onClick={()=>{setDraft(baseline());setRemovedNew([]);setError("");}}>Undo all changes</Button>
    <Button type="button" variant="ghost" disabled={pending}
     onClick={guard.requestClose}>Cancel</Button>
    <span className="text-xs text-body">Resources are shared with the workspace team.</span>
   </div>
  </div>:null}
  <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
   title="Discard unsaved changes?"
   description="Leave the resource library without saving your edits?"
   confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
 </section>;
}
