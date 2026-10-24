"use client";
import { Button } from "@/components/ui/button";
import { MetricBar } from "@/components/ui/metric-bar";
import barStyles from "./project-workspace-readiness.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Disclosure } from "@/components/ui/disclosure";
import { Alert } from "@/components/ui/alert";

import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {projectMutation} from "./project-api";
import {mentorPrivatePreviewKind,mentorPrivatePreviewGrantValid} from "@/modules/projects/mentor-private-resource-preview-model";
import {mentorPdfEmbedUrl} from "@/modules/projects/mentor-pdf-evidence-controls-model";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {acceptAttributeFor,formatFileSize,isSafeSignedUrl,limitsSummary} from "@/modules/storage/ui-models";
import {
  fileStatusDescriptor,projectFileUsable,projectResourceFileDeclaration,
  storageErrorMessage,validProjectResourceUploadGrant,PROJECT_FILE_LIMIT,
  type ProjectResourceFile,
} from "@/modules/projects/project-resource-files-ui-model";

type FileResponse={file:ProjectResourceFile};
type FileListResponse={files:ProjectResourceFile[]};
type GrantResponse=FileResponse&{grant:unknown};
type DownloadResponse={grant:{url:string;expiresAt:string}};
class FileApiError extends Error {
  constructor(readonly code:string){super(storageErrorMessage(code));}
}
async function jsonRequest<T>(path:string,method:"GET"|"POST"|"PATCH"|"DELETE",body?:unknown):Promise<T>{
  const response=await fetch(path,{
    method,cache:"no-store",credentials:"same-origin",
    ...(body!==undefined?{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}:{}),
  });
  if(!response.ok){
    const error=await response.json().catch(()=>({error:"STORAGE_INVALID_STATE"})) as {error?:string};
    throw new FileApiError(error.error??"STORAGE_INVALID_STATE");
  }
  return response.json() as Promise<T>;
}
function putWithProgress(file:File,url:string,headers:Record<string,string>,
  onProgress:(value:number)=>void,onXhr:(xhr:XMLHttpRequest|null)=>void){
  return new Promise<void>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    onXhr(xhr);
    xhr.open("PUT",url,true);
    // The presignature binds these headers: never attach another header.
    for(const [name,value] of Object.entries(headers))xhr.setRequestHeader(name,value);
    xhr.upload.onprogress=event=>{
      if(event.lengthComputable)onProgress(Math.round(100*event.loaded/event.total));
    };
    xhr.onload=()=>{
      onXhr(null);
      if(xhr.status>=200&&xhr.status<300)resolve();
      else reject(new Error("Upload failed"));
    };
    xhr.onerror=()=>{onXhr(null);reject(new Error("Upload failed"));};
    xhr.onabort=()=>{onXhr(null);reject(new Error("Upload cancelled"));};
    xhr.send(file);
  });
}
export function ProjectResourceFilesPanel({projectId,initialFiles,resources=[],canManage,canUpload=canManage}:{
  projectId:string;initialFiles:ProjectResourceFile[];canManage:boolean;canUpload?:boolean;
  resources?:readonly {id:string;title:string;status?:string;updatedAt?:string}[];
}){
  const router=useRouter();
  const [files,setFiles]=useState(initialFiles);
  const [publishTarget,setPublishTarget]=useState<ProjectResourceFile|null>(null);
  const [preview,setPreview]=useState<{id:string;url:string;expiresAt:string;kind:"PDF"|"IMAGE"}|null>(null);
  const [pdfPage,setPdfPage]=useState(1);
  const [pdfZoom,setPdfZoom]=useState(100);
  const [selected,setSelected]=useState<File|null>(null);
  const [uploadTitle,setUploadTitle]=useState("");
  const [uploadDescription,setUploadDescription]=useState("");
  const [linkedResourceId,setLinkedResourceId]=useState("");
  const [progress,setProgress]=useState<number|null>(null);
  const [uploadPhase,setUploadPhase]=useState<"PUT"|null>(null);
  const uploadingRef=useRef(false);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<ProjectResourceFile|null>(null);
  const [editTitle,setEditTitle]=useState("");
  const [editDescription,setEditDescription]=useState("");
  const xhrRef=useRef<XMLHttpRequest|null>(null);
  const fileInputRef=useRef<HTMLInputElement|null>(null);
  const [feedbackTone,setFeedbackTone]=useState<"success"|"error"|"info">("info");
  const editingFile=files.find(file=>file.id===editing);
  const dirty=Boolean(selected||uploadTitle.trim()||uploadDescription.trim()||linkedResourceId)||
    Boolean(editingFile&&(editTitle!==editingFile.title||editDescription!==(editingFile.description??"")));
  function discardDraft(){
    if(fileInputRef.current)fileInputRef.current.value="";
    setSelected(null);setUploadTitle("");setUploadDescription("");setLinkedResourceId("");
    setEditing(null);setEditTitle("");setEditDescription("");
  }
  const discardGuard=useProjectEditorDiscardGuard(true,dirty,busy,discardDraft);
  const endpoint="/api/projects/"+encodeURIComponent(projectId)+"/resource-files";
  const fileEndpoint=(fileId:string)=>endpoint+"/"+encodeURIComponent(fileId);
  useEffect(()=>{
    if(!preview)return;
    const remaining=Date.parse(preview.expiresAt)-Date.now();
    const timeout=window.setTimeout(()=>setPreview(null),Math.max(1,Math.min(remaining,2147483647)));
    return ()=>window.clearTimeout(timeout);
  },[preview]);
  async function refresh(){
    const next=await jsonRequest<FileListResponse>(endpoint,"GET");
    setFiles(next.files);
  }
  function problem(error:unknown){
    setFeedbackTone("error");
    setFeedback(error instanceof FileApiError?error.message:storageErrorMessage(null));
  }
  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected||busy||uploadingRef.current)return;
    const declaration=projectResourceFileDeclaration(selected);
    if(!declaration.ok){setFeedbackTone("error");setFeedback(storageErrorMessage(declaration.error));return;}
    if(files.length>=PROJECT_FILE_LIMIT){
      setFeedbackTone("error");setFeedback(storageErrorMessage("STORAGE_FILE_LIMIT_REACHED"));return;
    }
    uploadingRef.current=true;
    setBusy(true);setFeedback(null);setProgress(0);
    try{
      const response=await jsonRequest<GrantResponse>(endpoint,"POST",{
        originalName:declaration.originalName,contentType:declaration.contentType,
        sizeBytes:declaration.sizeBytes,...(linkedResourceId?{resourceId:linkedResourceId}:{}),
        ...(uploadTitle.trim()?{title:uploadTitle.trim()}:{}),
        ...(uploadDescription.trim()?{description:uploadDescription.trim()}:{}),
      });
      if(!validProjectResourceUploadGrant(response.grant)||
         response.grant.fileId!==response.file.id||
         Date.parse(response.grant.expiresAt)<=Date.now()){
        throw new FileApiError("STORAGE_UPLOAD_EXPIRED");
      }
      setFiles(current=>[...current.filter(row=>row.id!==response.file.id),response.file]);
      setUploadPhase("PUT");
      await putWithProgress(selected,response.grant.uploadUrl,response.grant.requiredHeaders,
        setProgress,xhr=>{xhrRef.current=xhr;});
      setUploadPhase(null);
      const completed=await jsonRequest<FileResponse>(fileEndpoint(response.file.id)+"/complete","POST");
      setFiles(current=>current.map(row=>row.id===completed.file.id?completed.file:row));
      await refresh();
      if(fileInputRef.current)fileInputRef.current.value="";
      setSelected(null);setUploadTitle("");setUploadDescription("");setLinkedResourceId("");
      setFeedbackTone("success");
      setFeedback(completed.file.status==="READY"?"Attached":fileStatusDescriptor(completed.file.status).label);
    }catch(error){
      problem(error);
      // An UPLOADING record remains discoverable; Retry calls complete after the PUT has landed.
      try{await refresh();}catch{/* Keep the latest known row; never expose the grant. */}
    }finally{uploadingRef.current=false;setBusy(false);setProgress(null);setUploadPhase(null);}
  }
  async function publishDraftResource(){
    const file=publishTarget;
    if(!file||busy||file.status!=="READY"||!file.resourceId)return;
    const linked=resources.find(row=>row.id===file.resourceId);
    if(!linked||linked.status!=="DRAFT"||!linked.updatedAt)return;
    setBusy(true);setFeedback(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
        "/resources/"+encodeURIComponent(linked.id),"PATCH",{
        status:"ACTIVE",expectedUpdatedAt:linked.updatedAt,
      });
      setPublishTarget(null);
      setFeedbackTone("success");
      setFeedback("Verified file resource published to the project team.");
      router.refresh();
    }catch(error){problem(error);}
    finally{setBusy(false);}
  }
  async function retryComplete(file:ProjectResourceFile){
    setBusy(true);setFeedback(null);
    try{
      const completed=await jsonRequest<FileResponse>(fileEndpoint(file.id)+"/complete","POST");
      setFiles(rows=>rows.map(row=>row.id===file.id?completed.file:row));
      await refresh();
      setFeedbackTone("success");setFeedback(fileStatusDescriptor(completed.file.status).label);
    }catch(error){problem(error);}finally{setBusy(false);}
  }
  async function download(file:ProjectResourceFile){
    if(!projectFileUsable(file))return;
    setFeedback(null);
    try{
      const result=await jsonRequest<DownloadResponse>(fileEndpoint(file.id)+"/download-grant","POST",{
        disposition:"attachment",
      });
      if(!isSafeSignedUrl(result.grant.url))throw new FileApiError("STORAGE_NOT_FOUND");
      // Short-lived signed URL stays local to this click; never render, cache or log it.
      window.location.assign(result.grant.url);
    }catch(error){problem(error);}
  }
  async function openPreview(file:ProjectResourceFile){
    const kind=mentorPrivatePreviewKind(file.contentType);
    if(!projectFileUsable(file)||!kind||busy)return;
    setPreview(null);setBusy(true);setFeedback(null);
    try{
      const result=await jsonRequest<DownloadResponse>(
        fileEndpoint(file.id)+"/download-grant","POST",{
          disposition:"inline",
        });
      if(!mentorPrivatePreviewGrantValid(result.grant,Date.now(),isSafeSignedUrl))
        throw new FileApiError("STORAGE_NOT_FOUND");
      setPdfPage(1);setPdfZoom(100);
      setPreview({id:file.id,url:result.grant.url,
        expiresAt:result.grant.expiresAt,kind});
    }catch(error){problem(error);}finally{setBusy(false);}
  }
  function beginEdit(file:ProjectResourceFile){
    setEditing(file.id);setEditTitle(file.title);setEditDescription(file.description??"");
    setFeedback(null);
  }
  async function saveEdit(event:FormEvent<HTMLFormElement>,file:ProjectResourceFile){
    event.preventDefault();
    if(!editTitle.trim())return;
    setBusy(true);setFeedback(null);
    try{
      const result=await jsonRequest<FileResponse>(fileEndpoint(file.id),"PATCH",{
        title:editTitle.trim(),description:editDescription.trim()||null,
      });
      setFiles(rows=>rows.map(row=>row.id===file.id?result.file:row));
      setEditing(null);setFeedbackTone("success");setFeedback("Resource updated.");
    }catch(error){problem(error);}finally{setBusy(false);}
  }
  async function remove(file:ProjectResourceFile){
    if(busy)return;
    setBusy(true);setFeedback(null);
    try{
      await jsonRequest<FileResponse>(fileEndpoint(file.id),"DELETE");
      setFiles(rows=>rows.filter(row=>row.id!==file.id));
      setDeleteTarget(null);setFeedbackTone("success");setFeedback("Resource removed.");
    }catch(error){problem(error);}finally{setBusy(false);}
  }
  return <section aria-labelledby={"project-files-"+projectId} className="min-w-0 space-y-4 border-b border-border pb-[var(--lms-space-4)] [overflow-wrap:anywhere]">
    <h3 id={"project-files-"+projectId} className="m-0 text-base font-semibold text-[var(--lms-heading)]">Attached</h3>
    {canUpload&&<form onSubmit={upload} className="min-w-0 space-y-3 border-b border-border pb-4">
      <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]" htmlFor={"project-file-"+projectId}>Or upload a file</label>
      <Input ref={fileInputRef} id={"project-file-"+projectId} type="file" accept={acceptAttributeFor("project-resource")}
        disabled={busy||files.length>=PROJECT_FILE_LIMIT}
        onChange={event=>{setSelected(event.target.files?.[0]??null);setFeedback(null);}}
        className="block min-h-11 w-full min-w-0 max-w-full text-sm text-body file:mr-3 file:rounded-[var(--lms-control-radius)] file:border-0 file:bg-primary-subtle file:px-3 file:py-1 file:text-link"/>
      <p className="text-xs text-muted-foreground leading-[20px]">{limitsSummary("project-resource")}</p>
      <Disclosure title="File details (optional)" defaultOpen={Boolean(uploadTitle||uploadDescription||linkedResourceId)} contentClassName="grid min-w-0 grid-cols-1 gap-3 pt-3">
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
          <Input className="mt-[6px] block w-full"
            maxLength={200} value={uploadTitle} onChange={event=>setUploadTitle(event.target.value)}
            disabled={busy} placeholder="Resource title"/>
        </label>
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
          <Input className="mt-[6px] block w-full"
            maxLength={4000} value={uploadDescription} onChange={event=>setUploadDescription(event.target.value)}
            disabled={busy} placeholder="Short note about this resource"/>
        </label>
      </div>
      {resources.length>0?<label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Related resource (optional)
        <Select value={linkedResourceId} disabled={busy} onChange={event=>setLinkedResourceId(event.target.value)}
          className="mt-1 block w-full">
          <option value="">New standalone file</option>
          {resources.map(item=><option key={item.id} value={item.id}>{item.title}{item.status==="DRAFT"?" (draft · private)":""}</option>)}
        </Select>
      </label>:null}
      </Disclosure>
      {progress!==null&&<div role="status" className="text-xs text-body">
        Uploading… {progress}%
        <MetricBar role="progressbar" label="Project file upload progress"
          value={progress} maximum={100} unit="percent" className={barStyles["track"]+" mt-2 w-full"} />
      </div>}
      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap">
        <Button variant="primary" type="submit" loading={busy} disabled={busy||!selected}
          className="min-h-11 w-full md:min-h-9 md:w-auto">
          {busy?"Uploading…":"Upload file"}
        </Button>
        {uploadPhase==="PUT"&&<Button variant="secondary" type="button" disabled={!xhrRef.current} onClick={()=>xhrRef.current?.abort()}
          className="min-h-11 w-full md:min-h-9 md:w-auto">Cancel</Button>}
      </div>
    </form>}
    {files.length===0?<EmptyState title="No resources yet"
      description="Share the first link or file with your team." />:<ul className="divide-y divide-border">
      {files.map(file=>{
        const descriptor=fileStatusDescriptor(file.status);
        return <li key={file.id} className="min-w-0 py-4">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-foreground [overflow-wrap:anywhere]">{file.title}</p>
              <p className="break-words [overflow-wrap:anywhere] text-xs text-muted-foreground leading-[20px]">
                {file.originalName} · {formatFileSize(file.sizeBytes)}
              </p>
              {file.description&&<p className="mt-1 break-words text-sm text-body leading-[22px]">{file.description}</p>}
              {file.resourceId&&resources.some(item=>item.id===file.resourceId)?
                <p className="mt-1 text-xs font-semibold text-body leading-[20px]">Resource: {resources.find(item=>item.id===file.resourceId)?.title}</p>:null}
              <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
                Last updated: <time dateTime={file.completedAt??file.createdAt}>
                  {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})
                    .format(new Date(file.completedAt??file.createdAt))} IST
                </time>
              </p>
              <p role="status" className="mt-1 text-xs text-body leading-[20px]" title={descriptor.detail}>
                {descriptor.label}
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap">
              {projectFileUsable(file)&&mentorPrivatePreviewKind(file.contentType)?
                <Button variant="secondary" type="button" disabled={busy}
                  onClick={()=>void openPreview(file)}
                  className="min-h-11 w-full md:min-h-9 md:w-auto">
                  Preview file
                </Button>:null}
              {projectFileUsable(file)&&<Button variant="secondary" type="button" disabled={busy} onClick={()=>void download(file)}
                className="min-h-11 w-full md:min-h-9 md:w-auto">Download file</Button>}
              {canManage&&file.status==="READY"&&file.resourceId&&
                resources.some(item=>item.id===file.resourceId&&item.status==="DRAFT")?
                <Button variant="primary" type="button" disabled={busy}
                  onClick={()=>{setFeedback(null);setPublishTarget(file);}}
                  className="min-h-11 w-full md:min-h-9 md:w-auto">
                  Publish linked draft
                </Button>:null}
              {canManage&&file.status==="UPLOADING"&&<Button variant="secondary" type="button" disabled={busy}
                  onClick={()=>void retryComplete(file)} className="min-h-11 w-full md:min-h-9 md:w-auto">Retry</Button>}
            </div>
          </div>
          {preview?.id===file.id?<section
            className="mt-3 space-y-3 border border-border p-3"
            aria-label={"Private file preview for "+file.title}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-semibold">Private preview · {file.title}</h4>
              <Button type="button" variant="secondary" size="sm"
                onClick={()=>setPreview(null)}>Close preview</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Access is checked again for each short-lived preview request.
              The preview closes when its authorization grant expires.
            </p>
            {preview.kind==="PDF"?<div className="flex flex-wrap items-center gap-3"
              role="group" aria-label="PDF page and zoom">
              <Button type="button" variant="secondary" size="sm"
                disabled={pdfPage<=1} onClick={()=>setPdfPage(n=>Math.max(1,n-1))}>
                Previous page
              </Button>
              <label>Page
                <input className="ml-2 w-20 rounded border border-border p-2"
                  type="number" min={1} max={999} value={pdfPage}
                  onChange={event=>{
                    const n=Number(event.target.value);
                    if(Number.isSafeInteger(n))setPdfPage(Math.max(1,Math.min(999,n)));
                  }}/>
              </label>
              <Button type="button" size="sm" variant="secondary"
                disabled={pdfPage>=999} onClick={()=>setPdfPage(n=>Math.min(999,n+1))}>
                Next page
              </Button>
              <label>Zoom
                <select className="ml-2 rounded border border-border p-2"
                  value={pdfZoom}
                  onChange={event=>setPdfZoom(Number(event.target.value))}>
                  {[50,75,100,125,150,200].map(n=><option key={n} value={n}>{n}%</option>)}
                </select>
              </label>
            </div>:null}
            {preview.kind==="PDF"?<iframe title={"Private PDF "+file.title}
              src={mentorPdfEmbedUrl(preview.url,pdfPage,pdfZoom)??undefined}
              sandbox="" loading="lazy" referrerPolicy="no-referrer"
              className="h-[29rem] w-full border border-border"/>:
              <img src={preview.url} alt={"Preview of "+file.title}
                referrerPolicy="no-referrer" className="max-h-[29rem] max-w-full"
                />}
            <p className="text-xs text-muted-foreground">
              Some PDF viewers or file providers may block embedding.
              Use Download file for unsupported formats or blocked previews.
            </p>
          </section>:null}
          {canManage?<Disclosure title="Manage file" className="mt-2" contentClassName="flex min-w-0 flex-wrap gap-2 pt-2">
            <Button variant="secondary" aria-label={"Edit resource "+file.title} disabled={busy} onClick={()=>beginEdit(file)} className="min-h-11 w-full md:min-h-9 md:w-auto">Edit resource</Button>
            <Button variant="link" aria-label={"Delete resource "+file.title} disabled={busy} onClick={()=>{setFeedback(null);setDeleteTarget(file);}} className="min-h-11 w-full !text-[var(--lms-error)] md:min-h-9 md:w-auto">Delete</Button>
          </Disclosure>:null}
          {editing===file.id&&canManage&&<form onSubmit={event=>void saveEdit(event,file)}
            className="mt-3 grid min-w-0 gap-3 border-t border-[var(--lms-canvas-border)] pt-3 md:grid-cols-2">
            <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
              <Input required maxLength={200} value={editTitle} disabled={busy}
                onChange={event=>setEditTitle(event.target.value)}
                className="mt-1 block w-full"/>
            </label>
            <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description
              <Input maxLength={4000} value={editDescription} disabled={busy}
                onChange={event=>setEditDescription(event.target.value)}
                className="mt-1 block w-full"/>
            </label>
            <div className="flex min-w-0 flex-col gap-2 md:flex-row md:col-span-2">
              <Button variant="primary" type="submit" loading={busy} disabled={busy||!editTitle.trim()}
                className="min-h-11 w-full md:min-h-9 md:w-auto">Update resource</Button>
              <Button variant="secondary" type="button" disabled={busy} onClick={discardGuard.requestClose}
                className="min-h-11 w-full md:min-h-9 md:w-auto">Cancel</Button>
            </div>
          </form>}
        </li>;
      })}
    </ul>}
    {feedback&&!(deleteTarget&&feedbackTone==="error")?<Alert tone={feedbackTone} role={feedbackTone==="error"?"alert":"status"}>{feedback}</Alert>:null}
    <ConfirmDialog open={publishTarget!==null}
      onOpenChange={value=>{if(!value&&!busy)setPublishTarget(null);}}
      title="Publish verified file to students?"
      description="The linked draft resource becomes active and visible to students with project access. Only verified CLEAN uploads qualify; this does not change other private resources."
      confirmLabel="Publish resource" pending={busy}
      onConfirm={()=>void publishDraftResource()}/>
    <ConfirmDialog open={discardGuard.discardOpen} onOpenChange={discardGuard.setDiscardOpen}
      title="Discard resource changes?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={busy} onConfirm={discardGuard.confirmDiscard}/>
    <ConfirmDialog open={deleteTarget!==null} onOpenChange={open=>{if(!open&&!busy)setDeleteTarget(null);}}
      title={deleteTarget?`Delete "${deleteTarget.title}"?`:"Delete resource?"}
      description="This permanently removes the resource for everyone on the project."
      confirmLabel="Delete resource" confirmVariant="danger" pending={busy}
      onConfirm={()=>{if(deleteTarget)void remove(deleteTarget);}}>
      {feedback&&feedbackTone==="error"?<Alert tone="error" role="alert">{feedback}</Alert>:null}
    </ConfirmDialog>
  </section>;
}
