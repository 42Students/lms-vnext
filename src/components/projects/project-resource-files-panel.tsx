"use client";

import {useRef,useState,type FormEvent} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
export function ProjectResourceFilesPanel({projectId,initialFiles,canManage,canUpload=canManage}:{
  projectId:string;initialFiles:ProjectResourceFile[];canManage:boolean;canUpload?:boolean;
}){
  const [files,setFiles]=useState(initialFiles);
  const [selected,setSelected]=useState<File|null>(null);
  const [uploadTitle,setUploadTitle]=useState("");
  const [uploadDescription,setUploadDescription]=useState("");
  const [progress,setProgress]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState<string|null>(null);
  const [editing,setEditing]=useState<string|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<ProjectResourceFile|null>(null);
  const [editTitle,setEditTitle]=useState("");
  const [editDescription,setEditDescription]=useState("");
  const xhrRef=useRef<XMLHttpRequest|null>(null);
  const endpoint="/api/projects/"+encodeURIComponent(projectId)+"/resource-files";
  const fileEndpoint=(fileId:string)=>endpoint+"/"+encodeURIComponent(fileId);
  async function refresh(){
    const next=await jsonRequest<FileListResponse>(endpoint,"GET");
    setFiles(next.files);
  }
  function problem(error:unknown){
    setFeedback(error instanceof Error?error.message:storageErrorMessage(null));
  }
  async function upload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected)return;
    const declaration=projectResourceFileDeclaration(selected);
    if(!declaration.ok){setFeedback(storageErrorMessage(declaration.error));return;}
    if(files.length>=PROJECT_FILE_LIMIT){
      setFeedback(storageErrorMessage("STORAGE_FILE_LIMIT_REACHED"));return;
    }
    setBusy(true);setFeedback(null);setProgress(0);
    try{
      const response=await jsonRequest<GrantResponse>(endpoint,"POST",{
        originalName:declaration.originalName,contentType:declaration.contentType,
        sizeBytes:declaration.sizeBytes,...(uploadTitle.trim()?{title:uploadTitle.trim()}:{}),
        ...(uploadDescription.trim()?{description:uploadDescription.trim()}:{}),
      });
      if(!validProjectResourceUploadGrant(response.grant)||
         response.grant.fileId!==response.file.id||
         Date.parse(response.grant.expiresAt)<=Date.now()){
        throw new FileApiError("STORAGE_UPLOAD_EXPIRED");
      }
      setFiles(current=>[...current.filter(row=>row.id!==response.file.id),response.file]);
      await putWithProgress(selected,response.grant.uploadUrl,response.grant.requiredHeaders,
        setProgress,xhr=>{xhrRef.current=xhr;});
      const completed=await jsonRequest<FileResponse>(fileEndpoint(response.file.id)+"/complete","POST");
      setFiles(current=>current.map(row=>row.id===completed.file.id?completed.file:row));
      await refresh();
      setSelected(null);setUploadTitle("");setUploadDescription("");
      setFeedback(completed.file.status==="READY"?"Attached":fileStatusDescriptor(completed.file.status).label);
    }catch(error){
      problem(error);
      // An UPLOADING record remains discoverable; Retry calls complete after the PUT has landed.
      try{await refresh();}catch{/* Keep the latest known row; never expose the grant. */}
    }finally{setBusy(false);setProgress(null);}
  }
  async function retryComplete(file:ProjectResourceFile){
    setBusy(true);setFeedback(null);
    try{
      const completed=await jsonRequest<FileResponse>(fileEndpoint(file.id)+"/complete","POST");
      setFiles(rows=>rows.map(row=>row.id===file.id?completed.file:row));
      await refresh();
      setFeedback(fileStatusDescriptor(completed.file.status).label);
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
      setEditing(null);
    }catch(error){problem(error);}finally{setBusy(false);}
  }
  async function remove(file:ProjectResourceFile){
    if(busy)return;
    setBusy(true);setFeedback(null);
    try{
      await jsonRequest<FileResponse>(fileEndpoint(file.id),"DELETE");
      setFiles(rows=>rows.filter(row=>row.id!==file.id));
      setDeleteTarget(null);
    }catch(error){problem(error);}finally{setBusy(false);}
  }
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
    <h3 className="m-0 text-base font-semibold text-foreground">Attached</h3>
    {canUpload&&<form onSubmit={upload} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-body">Title
          <input className="mt-1 block w-full rounded border border-border bg-surface p-2"
            maxLength={200} value={uploadTitle} onChange={event=>setUploadTitle(event.target.value)}
            disabled={busy} placeholder="Resource title"/>
        </label>
        <label className="text-sm font-medium text-body">Description
          <input className="mt-1 block w-full rounded border border-border bg-surface p-2"
            maxLength={4000} value={uploadDescription} onChange={event=>setUploadDescription(event.target.value)}
            disabled={busy} placeholder="Short note about this resource"/>
        </label>
      </div>
      <label className="block text-sm font-medium text-body" htmlFor={"project-file-"+projectId}>Or upload a file</label>
      <input id={"project-file-"+projectId} type="file" accept={acceptAttributeFor("project-resource")}
        disabled={busy||files.length>=PROJECT_FILE_LIMIT}
        onChange={event=>setSelected(event.target.files?.[0]??null)}
        className="block max-w-full text-sm text-body"/>
      <p className="text-xs text-muted-foreground">{limitsSummary("project-resource")}</p>
      {progress!==null&&<div role="status" className="text-xs text-body">
        Uploading… {progress}%
        <progress value={progress} max={100} className="ml-2 max-w-full"/>
      </div>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy||!selected}
          className="rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy?"Uploading…":"Upload file"}
        </button>
        {busy&&<button type="button" onClick={()=>xhrRef.current?.abort()}
          className="rounded border border-border px-3 py-2 text-sm">Cancel</button>}
      </div>
    </form>}
    {files.length===0?<p className="text-sm text-muted-foreground">
      No resources yet. Share the first link or file with your team.
    </p>:<ul className="space-y-3">
      {files.map(file=>{
        const descriptor=fileStatusDescriptor(file.status);
        return <li key={file.id} className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-foreground">{file.title}</p>
              <p className="break-all text-xs text-muted-foreground">
                {file.originalName} · {formatFileSize(file.sizeBytes)}
              </p>
              {file.description&&<p className="mt-1 text-sm text-body">{file.description}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Last updated: <time dateTime={file.completedAt??file.createdAt}>
                  {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})
                    .format(new Date(file.completedAt??file.createdAt))} IST
                </time>
              </p>
              <p role="status" className="mt-1 text-xs text-body" title={descriptor.detail}>
                {descriptor.label}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectFileUsable(file)&&<button type="button" disabled={busy} onClick={()=>void download(file)}
                className="rounded border border-border px-3 py-1.5 text-sm">Open file</button>}
              {canManage&&<>
                {file.status==="UPLOADING"&&<button type="button" disabled={busy}
                  onClick={()=>void retryComplete(file)} className="rounded border border-border px-3 py-1.5 text-sm">Retry</button>}
                <button type="button" disabled={busy} onClick={()=>beginEdit(file)}
                  className="rounded border border-border px-3 py-1.5 text-sm">Edit resource</button>
                <button type="button" disabled={busy} onClick={()=>setDeleteTarget(file)}
                  className="rounded border border-border px-3 py-1.5 text-sm">Delete</button>
              </>}
            </div>
          </div>
          {editing===file.id&&canManage&&<form onSubmit={event=>void saveEdit(event,file)}
            className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-sm text-body">Title
              <input required maxLength={200} value={editTitle} disabled={busy}
                onChange={event=>setEditTitle(event.target.value)}
                className="mt-1 block w-full rounded border border-border bg-surface p-2"/>
            </label>
            <label className="text-sm text-body">Description
              <input maxLength={4000} value={editDescription} disabled={busy}
                onChange={event=>setEditDescription(event.target.value)}
                className="mt-1 block w-full rounded border border-border bg-surface p-2"/>
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={busy||!editTitle.trim()}
                className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Update resource</button>
              <button type="button" disabled={busy} onClick={()=>setEditing(null)}
                className="rounded border border-border px-3 py-2 text-sm">Cancel</button>
            </div>
          </form>}
        </li>;
      })}
    </ul>}
    {feedback&&<p role="status" className="text-sm text-body">{feedback}</p>}
    <ConfirmDialog open={deleteTarget!==null} onOpenChange={open=>{if(!open&&!busy)setDeleteTarget(null);}}
      title={deleteTarget?`Delete "${deleteTarget.title}"?`:"Delete resource?"}
      description="This permanently removes the resource for everyone on the project."
      confirmLabel="Delete resource" confirmVariant="danger" pending={busy}
      onConfirm={()=>{if(deleteTarget)void remove(deleteTarget);}}/>
  </section>;
}
