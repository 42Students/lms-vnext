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
import {
  makeResourceKey,legacyResourceKinds,type ProjectResourceLibraryRow,
} from "@/modules/projects/project-resource-library-model";

type DraftRow=ProjectResourceLibraryRow&{clientKey:string};
function withClientKey(row:ProjectResourceLibraryRow):DraftRow{
  return {...row,clientKey:row.id??"new:"+row.key};
}
function unchanged(rows:readonly ProjectResourceLibraryRow[]):DraftRow[]{
  return rows.map(withClientKey);
}

/** Legacy resource-library form, supplementing the newer searchable directory.
 * No mutation happens until Save. Remove is undoable until the atomic commit.
 */
export function ProjectResourceLibraryEditor({projectId,token,resources}:{
  projectId:string;token:string;resources:readonly ProjectResourceLibraryRow[];
}){
  const router=useRouter();
  const {showToast}=useToast();
  const pendingRef=useRef(false);
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(false);
  const [attempted,setAttempted]=useState(false);
  const [search,setSearch]=useState("");
  const [draft,setDraft]=useState<DraftRow[]>(()=>unchanged(resources));
  const baseline=unchanged(resources);
  const dirty=JSON.stringify(draft.map(({clientKey:_,...row})=>row))!==JSON.stringify(resources);
  const removed=draft.filter(row=>row.status==="ARCHIVED").length;
  const active=draft.filter(row=>row.status!=="ARCHIVED");
  const files=draft.filter(row=>row.legacyKind!=="Link").length;
  const links=draft.filter(row=>row.legacyKind==="Link").length;
  const notes=draft.filter(row=>Boolean(row.accessNotes?.trim())).length;
  const errors=draft.map((row,index)=>{
    if(!row.title.trim())return "Item "+(index+1)+": Title required";
    if(row.title.length>200)return "Item "+(index+1)+": Title must be 200 characters or fewer";
    if(!row.key.trim())return "Item "+(index+1)+": Key is required";
    if(row.url&&!/^https?:\/\//i.test(row.url))return "Item "+(index+1)+": Use an HTTP(S) URL";
    if((row.url?.length??0)>2048)return "Item "+(index+1)+": URL is too long";
    if((row.description?.length??0)>4000||(row.accessNotes?.length??0)>4000)
      return "Item "+(index+1)+": Text is too long";
    return "";
  }).filter(Boolean);
  const keys=new Set(draft.map(row=>row.key.toLowerCase()));
  const duplicateKeys=keys.size!==draft.length;
  function close(){
    setDraft(unchanged(resources));setOpen(false);setSearch("");setAttempted(false);
  }
  const guard=useProjectEditorDiscardGuard(open,dirty,pending,close);
  function update(clientKey:string,patch:Partial<ProjectResourceLibraryRow>){
    setDraft(current=>current.map(row=>row.clientKey===clientKey?{...row,...patch}:row));
  }
  function add(){
    if(draft.length>=500){
      showToast({tone:"error",title:"Resource limit reached",
        description:"The resource library supports up to 500 items."});
      return;
    }
    const id="new:"+crypto.randomUUID();
    const n=draft.length+1;
    const taken=new Set(draft.map(row=>row.key.toLowerCase()));
    let key="resource-"+n;
    while(taken.has(key))key+="-" + (n+1);
    setDraft(current=>[...current,{
      clientKey:id,id:null,key,title:"",legacyKind:"Link",
      url:null,description:null,accessNotes:null,pinned:false,required:false,
      visibility:"TEAM",status:"ACTIVE",
    }]);
    setOpen(true);
  }
  function move(clientKey:string,direction:-1|1){
    setDraft(current=>{
      const from=current.findIndex(row=>row.clientKey===clientKey),to=from+direction;
      if(from<0||to<0||to>=current.length)return current;
      const next=[...current];[next[from],next[to]]=[next[to]!,next[from]!];
      return next;
    });
  }
  async function save(){
    if(pendingRef.current)return;
    setAttempted(true);
    if(!dirty){showToast({tone:"info",title:"No changes to save"});return;}
    if(errors.length||duplicateKeys||draft.length>500){
      showToast({tone:"error",title:"Failed to update resources",
        description:errors[0]??(duplicateKeys?"Duplicate resource key":"Maximum 500 resources")});
      return;
    }
    pendingRef.current=true;setPending(true);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
        "/resources/library","PATCH",{
          expectedToken:token,
          rows:draft.map(({clientKey:_,...row})=>row),
        });
      showToast({tone:"success",title:"Resources updated"});
      setOpen(false);router.refresh();
    }catch(error){
      showToast({tone:"error",title:"Failed to update resources",
        description:error instanceof Error?error.message:
          "The resource library changed. Refresh before retrying."});
    }finally{pendingRef.current=false;setPending(false);}
  }
  const visible=draft.filter(row=>!search.trim()||
    (row.title+" "+row.key).toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="space-y-4 border-b border-[var(--lms-canvas-border)] pb-5"
    aria-label="Resource library editor">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">
        Project references
      </p>
      <h2 className="text-lg font-semibold text-foreground">Resource library</h2>
      <p className="text-sm font-semibold text-foreground">
        Keep everything the team needs in one curated place
      </p>
      <p className="text-sm leading-6 text-body">
        Add only useful project references, label them clearly, and include access
        notes when a link or file needs a college account, permission request,
        or other prerequisite.
      </p>
    </header>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Resource library summary">
      {([["Resources",draft.length],["Links",links],
        ["Files & media",files],["With access notes",notes]] as const)
        .map(([label,count])=><div key={label} className="border-b border-border py-2">
          <dt className="text-xs text-body">{label}</dt>
          <dd className="text-xl font-semibold tabular-nums">{count}</dd>
        </div>)}
    </dl>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" aria-expanded={open}
        onClick={()=>open?guard.requestClose():setOpen(true)}>
        {open?"Close resource library":"Edit resource library"}
      </Button>
      <p className="text-xs text-body">
        {active.length} active or draft · {removed} archived · {dirty?"Unsaved changes":"Saved"}
      </p>
    </div>
    {open?<div className="space-y-4">
      {draft.length>8?<label className="block text-sm font-semibold text-body">
        Find a resource
        <Input type="search" className="mt-1" value={search}
          placeholder="Search title or key" onChange={event=>setSearch(event.target.value)}/>
      </label>:null}
      <p className="text-xs text-body">
        Edit multiple resources, change their order, or remove items. All changes
        are saved together. Removing an item archives it; the row stays available
        to restore until Save.
      </p>
      {visible.map(row=>{
        const index=draft.findIndex(item=>item.clientKey===row.clientKey);
        const original=baseline.find(item=>item.clientKey===row.clientKey);
        const rowDirty=JSON.stringify(row)!==JSON.stringify(original);
        return <details key={row.clientKey} className="border-b border-border py-2"
          open={!row.title.trim()?true:undefined}>
          <summary className="cursor-pointer min-h-11 py-2 text-sm font-semibold text-foreground">
            {row.title||"New resource"} · {row.legacyKind}
            {row.status==="ARCHIVED"?" · Removed":rowDirty?" · Edited":""}
          </summary>
          <fieldset disabled={pending} className="grid min-w-0 gap-3 py-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-body">Title
              <Input className="mt-1" maxLength={200} value={row.title}
                aria-invalid={attempted&&!row.title.trim()}
                onChange={event=>{
                  const title=event.target.value;
                  const generated=makeResourceKey(title);
                  update(row.clientKey,{
                    title,key:row.id?row.key:
                      row.key===makeResourceKey(row.title)?generated:row.key,
                  });
                }}/>
              {attempted&&!row.title.trim()?<span role="alert" className="text-xs text-error">
                Item {index+1}: Title required
              </span>:null}
            </label>
            <label className="text-xs font-semibold text-body">Stable key
              <Input className="mt-1" maxLength={120} value={row.key}
                disabled={Boolean(row.id)} onChange={event=>update(row.clientKey,{
                  key:event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"),
                })}/>
              <span className="mt-1 block text-xs font-normal text-body">
                {row.id?"Existing keys remain stable to preserve references.":"Generated from title; adjust before saving."}
              </span>
            </label>
            <label className="text-xs font-semibold text-body">Type
              <Select className="mt-1" value={row.legacyKind}
                onChange={event=>update(row.clientKey,{
                  legacyKind:event.target.value as ProjectResourceLibraryRow["legacyKind"],
                })}>
                {legacyResourceKinds.map(kind=><option key={kind} value={kind}>{kind}</option>)}
              </Select>
            </label>
            <label className="text-xs font-semibold text-body">URL (optional)
              <Input className="mt-1" type="url" maxLength={2048} value={row.url??""}
                placeholder="https://…" onChange={event=>update(row.clientKey,{
                  url:event.target.value||null,
                })}/>
            </label>
            <label className="text-xs font-semibold text-body md:col-span-2">Description
              <Textarea className="mt-1" maxLength={4000} value={row.description??""}
                onChange={event=>update(row.clientKey,{description:event.target.value||null})}/>
            </label>
            <label className="text-xs font-semibold text-body md:col-span-2">Access notes
              <Textarea className="mt-1" maxLength={4000} value={row.accessNotes??""}
                onChange={event=>update(row.clientKey,{accessNotes:event.target.value||null})}/>
            </label>
            <label className="text-xs font-semibold text-body">Visible to
              <Select className="mt-1" value={row.visibility}
                onChange={event=>update(row.clientKey,{
                  visibility:event.target.value as "TEAM"|"MENTOR_ONLY",
                })}>
                <option value="TEAM">Everyone</option>
                <option value="MENTOR_ONLY">Mentors only</option>
              </Select>
            </label>
            <label className="text-xs font-semibold text-body">Status
              <Select className="mt-1" value={row.status}
                onChange={event=>update(row.clientKey,{
                  status:event.target.value as "ACTIVE"|"DRAFT"|"ARCHIVED",
                })}>
                <option value="ACTIVE">Active</option><option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm text-body">
              <Checkbox checked={row.pinned} onChange={event=>update(row.clientKey,{
                pinned:event.target.checked,
              })}/> Pinned
            </label>
            <label className="flex items-center gap-2 text-sm text-body">
              <Checkbox checked={row.required} onChange={event=>update(row.clientKey,{
                required:event.target.checked,
              })}/> Required resource
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button size="sm" variant="secondary" disabled={index===0}
                onClick={()=>move(row.clientKey,-1)}>Move up</Button>
              <Button size="sm" variant="secondary" disabled={index===draft.length-1}
                onClick={()=>move(row.clientKey,1)}>Move down</Button>
              {row.status!=="ARCHIVED"?<Button size="sm" variant="ghost"
                onClick={()=>update(row.clientKey,{status:"ARCHIVED"})}>Remove</Button>:
                <Button size="sm" variant="secondary" onClick={()=>update(row.clientKey,{
                  status:original?.status==="DRAFT"?"DRAFT":"ACTIVE",
                })}>Undo remove</Button>}
            </div>
          </fieldset>
          {row.status==="ARCHIVED"?<p role="status" className="text-xs text-body">
            Item removed from this unsaved form. Undo remove
          </p>:null}
        </details>;
      })}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={pending||draft.length>=500}
          onClick={add}>Add resource</Button>
        <p className="self-center text-xs text-body">{draft.length}/500 resources</p>
      </div>
      {errors.length&&attempted?<p role="alert" className="text-sm text-error">{errors[0]}</p>:null}
      {duplicateKeys?<p role="alert" className="text-sm text-error">
        Resource keys must be unique.</p>:null}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="secondary" disabled={pending}
          onClick={guard.requestClose}>Cancel</Button>
        <Button type="button" loading={pending} disabled={pending}
          onClick={()=>void save()}>Save resource library</Button>
      </div>
      <p className="text-xs text-body">Resources are shared with the workspace team.</p>
    </div>:null}
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard unsaved changes?"
      description="Leave the resource library without saving its edits?"
      confirmLabel="Discard changes" pending={pending}
      onConfirm={guard.confirmDiscard}/>
  </section>;
}
