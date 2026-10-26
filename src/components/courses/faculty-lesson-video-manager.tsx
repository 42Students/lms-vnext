"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import {reportApiFailure,reportVideoFailure,reportUploadFailure} from "@/lib/report-client-error";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { MetricBar } from "@/components/ui/metric-bar";
import uploadStyles from "./legacy-upload-meter.module.css";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  acceptAttributeFor, formatFileSize, limitsSummary, videoProcessingDescriptor, videoPublishLabel,
} from "@/modules/storage/ui-models";
import {
  facultyVideoMayPreview, facultyVideoMayPublish, facultyVideoMayReplace,
  facultyVideoReorderPlan, facultyVideoPublishAction, managedVideoAfterAction,
  parseManagedVideos, type ManagedVideo,
} from "@/modules/courses/faculty-video-storage-model";
import { storageApiError } from "@/modules/courses/learner-storage-ui-model";
import { uploadFacultyLessonThumbnail, uploadFacultyLessonVideo } from "./faculty-video-transfer";
import { FacultyVideoPreview } from "./faculty-video-preview";

type Action = (signal: AbortSignal) => Promise<void>;
type VideoConfirmation = {kind: "DELETE"; video: ManagedVideo} | {kind: "REPLACE"; video: ManagedVideo; file: File};
type LessonContent = { id:string; contentType:string; storageKey:string|null; status:string; lessonId:string; deliveryId:string|null };
export function FacultyLessonVideoManager({
  lessonId,deliveryId,nextContentSequence,openUploadOnMount=false,
}: { lessonId:string;deliveryId:string|null;nextContentSequence:number;openUploadOnMount?:boolean }) {
  const router=useRouter();
  const {showToast}=useToast();
  const [videos,setVideos]=useState<ManagedVideo[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [activeName,setActiveName]=useState<string|null>(null);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState<string|null>(null);
  const [info,setInfo]=useState<string|null>(null);
  const [title,setTitle]=useState("");
  const [contentPoints,setContentPoints]=useState("1");
  const [duration,setDuration]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const detectedVideoDuration=useRef<string|null>(null);
  useEffect(()=>{
    const old=detectedVideoDuration.current;
    if(old)setDuration(value=>value===old?"":value);
    detectedVideoDuration.current=null;
    if(!file)return;
    const objectUrl=URL.createObjectURL(file);
    const preview=document.createElement("video");
    let cancelled=false;
    preview.preload="metadata";
    preview.onloadedmetadata=()=>{
      if(cancelled||!Number.isFinite(preview.duration)||preview.duration<=0||
         preview.duration>86400)return;
      const seconds=String(Math.ceil(preview.duration));
      detectedVideoDuration.current=seconds;
      setDuration(value=>value.trim()?value:seconds);
    };
    preview.onerror=()=>{/* Fall back to the editable duration field. */};
    preview.src=objectUrl;
    return()=>{
      cancelled=true;preview.removeAttribute("src");preview.load();
      URL.revokeObjectURL(objectUrl);
    };
  },[file]);

  const [durationDraft,setDurationDraft]=useState<Record<string,string>>({});
  const [titleDraft,setTitleDraft]=useState<Record<string,string>>({});
  const [previewId,setPreviewId]=useState<string|null>(null);
  const [confirmation,setConfirmation]=useState<VideoConfirmation|null>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [uploadDrawerOpen,setUploadDrawerOpen]=useState(openUploadOnMount);
  const controllerRef=useRef<AbortController|null>(null);
  const locked=useRef(false);

  async function list(signal:AbortSignal){
    const response=await fetch(
      `/api/courses/lessons/${encodeURIComponent(lessonId)}/videos${deliveryId?`?deliveryId=${encodeURIComponent(deliveryId)}`:""}`,
      {credentials:"same-origin",cache:"no-store",signal},
    );
    if(!response.ok)throw new Error(await storageApiError(response));
    const rows=parseManagedVideos(await response.json(),lessonId,deliveryId);
    if(!signal.aborted)setVideos(rows);
  }
  useEffect(()=>{
    const controller=new AbortController();
    controllerRef.current=controller;
    async function load(){
      try{await list(controller.signal);}
      catch(cause){if(!controller.signal.aborted){reportVideoFailure(cause);setError(cause instanceof Error?cause.message:"Could not load videos.");}}
      finally{if(!controller.signal.aborted)setLoading(false);}
    }
    void load();
    return()=>{controller.abort();controllerRef.current?.abort();};
  },[lessonId,deliveryId]);

  function run(action:Action,name:string|null=null,failureTitle?:string){
    if(locked.current)return;
    locked.current=true;
    const controller=new AbortController();
    controllerRef.current=controller;
    setBusy(true);setActiveName(name);setProgress(0);setError(null);setInfo(null);
    void (async()=>{
      try{await action(controller.signal);}
      catch(cause){
        if(!controller.signal.aborted){
          if(failureTitle?.toLowerCase().includes("upload"))reportUploadFailure(cause);
          else if(failureTitle?.toLowerCase().includes("video"))reportVideoFailure(cause);
          else reportApiFailure(cause);
          const detail=cause instanceof Error?cause.message:"Could not update lesson video.";

          setError(detail);
          if(failureTitle)showToast({tone:"error",title:failureTitle,description:detail});
        }
      }
      finally{
        if(!controller.signal.aborted){
          try{await list(controller.signal);}
          catch{setError(current=>current??"Could not refresh lesson videos.");}
        }
        locked.current=false;controllerRef.current=null;setBusy(false);setActiveName(null);setProgress(0);
      }
    })();
  }
  async function request(path:string,method:"POST"|"PATCH"|"DELETE",body:unknown,signal:AbortSignal){
    const response=await fetch(path,{
      method,credentials:"same-origin",cache:"no-store",signal,
      ...(body===undefined?{}:{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),
    });
    if(!response.ok)throw new Error(await storageApiError(response));
    return response.json() as Promise<unknown>;
  }
  function change(video:ManagedVideo,patch:Record<string,unknown>){
    run(async signal=>{
      const body=await request(`/api/courses/videos/${encodeURIComponent(video.id)}`,"PATCH",patch,signal);
      managedVideoAfterAction(body,video.id,lessonId);
    });
  }
  function upload(replace?:ManagedVideo,selected?:File){
    const chosen=selected??file;
    if(!chosen)return;
    const nextTitle=replace?.title??title.trim();
    const parsed=replace?.durationSeconds??(duration.trim()?Number(duration):null);
    if(!nextTitle){setError("Enter a title before uploading the video.");return;}
    if(parsed!==null&&(!Number.isInteger(parsed)||parsed<1||parsed>86400)){
      setError("Enter a duration between 1 second and 24 hours.");return;
    }
    run(async signal=>{
      const result=await uploadFacultyLessonVideo({
        lessonId,deliveryId,title:nextTitle,durationSeconds:parsed,
        file:chosen,...(replace?{replaceVideoId:replace.id}:{}),
        signal,onProgress:setProgress,
      });
      setFile(null);setTitle("");setDuration("");setUploadDrawerOpen(false);
      const scanReady=result.processingStatus==="READY";
      const notice=scanReady?chosen.name+" uploaded successfully!":
        chosen.name+" uploaded. Security verification is still pending.";
      setInfo(notice);
      showToast({tone:scanReady?"success":"info",title:notice,
        description:scanReady?"Video is ready for lesson linking.":
          "Processing and scan checks must finish before learners can watch it."});
      router.refresh();
    },chosen.name,"Upload failed");
  }
  function thumbnail(video:ManagedVideo,selected:File|null){
    if(!selected)return;
    run(async signal=>{
      const updated=await uploadFacultyLessonThumbnail({video,file:selected,signal,onProgress:setProgress});
      setInfo(updated.thumbnailStatus==="READY"?"Thumbnail updated.":"Checking thumbnail.");
    },selected.name);
  }
  async function lessonContents(signal:AbortSignal):Promise<LessonContent[]>{
    const response=await fetch(
      `/api/courses/lesson-contents?lessonId=${encodeURIComponent(lessonId)}${deliveryId?`&deliveryId=${encodeURIComponent(deliveryId)}`:""}`,
      {credentials:"same-origin",cache:"no-store",signal},
    );
    if(!response.ok)throw new Error(await storageApiError(response));
    const data=await response.json() as {contents:LessonContent[]};
    if(!Array.isArray(data.contents))throw new Error("Could not verify the lesson contents.");
    return data.contents.filter(item=>item.lessonId===lessonId && (item.deliveryId===deliveryId||item.deliveryId===null));
  }
  function linkContent(video:ManagedVideo){
    if(video.processingStatus!=="READY"){setError("Video must be ready before linking to a lesson.");return;}
    if(!video.durationSeconds){setError("Set a valid duration before adding video lesson content.");return;}
    const points=Number(contentPoints);
    if(!contentPoints.trim()){setError("Points are required.");return;}
    if(!Number.isInteger(points)||points<0||points>1000){setError("Points must be a whole number between 0 and 1000.");return;}
    run(async signal=>{
      const key=`video-asset/${video.id}`;
      const current=await lessonContents(signal);
      const existing=current.find(item=>item.contentType==="VIDEO"&&item.storageKey===key);
      const linked=video.lessonContentId?current.find(item=>item.id===video.lessonContentId):null;
      if(video.lessonContentId && (!linked||linked.contentType!=="VIDEO"||linked.storageKey!==key))
        throw new Error("The linked lesson content differs. Reload before changing publication.");
      let contentId=existing?.id??linked?.id;
      let currentStatus=existing?.status??linked?.status;
      if(!contentId){
        const created=await request("/api/courses/lesson-contents","POST",{
          lessonId,deliveryId,title:video.title,sequence:nextContentSequence,
          contentType:"VIDEO",storageKey:key,durationSeconds:video.durationSeconds,points,
        },signal) as {content?:{id?:string;status?:string}};
        contentId=created.content?.id;
        currentStatus=created.content?.status;
      }
      if(!contentId)throw new Error("Video content was not created. Refresh before trying again.");
      if(contentId && currentStatus!==undefined){
        await request(`/api/courses/lesson-contents/${encodeURIComponent(contentId)}`,"PATCH",{points},signal);
      }
      if(video.lessonContentId!==contentId){
        await request(`/api/courses/videos/${encodeURIComponent(video.id)}`,"PATCH",{lessonContentId:contentId},signal);
      }
      if(currentStatus==="DRAFT"){
        await request(`/api/courses/lesson-contents/${encodeURIComponent(contentId)}/transition`,"POST",{action:"PUBLISH"},signal);
      }
      // A ready video becomes available immediately after its lesson link
      // and learner-visible content are saved; no separate state maze.
      const published=await request(`/api/courses/videos/${encodeURIComponent(video.id)}`,"PATCH",{
        publishStatus:"PUBLISHED",visibleToStudents:true,
      },signal);
      managedVideoAfterAction(published,video.id,lessonId);
      setInfo("Video Created Successfully. Published to eligible learners.");
      router.refresh();
    });
  }
  function reorder(video:ManagedVideo,delta:-1|1){
    const plan=facultyVideoReorderPlan(video,delta,videos);
    if(!plan){setError("Video order is unavailable. Refresh the lesson.");return;}
    run(async signal=>{
      for(const step of plan){
        const payload=await request(`/api/courses/videos/${encodeURIComponent(step.id)}`,"PATCH",{sequence:step.sequence},signal);
        managedVideoAfterAction(payload,step.id,lessonId);
      }
    });
  }
  function confirmVideoAction() {
    if (!confirmation || busy) return;
    const action = confirmation;
    setConfirmation(null);
    if (action.kind === "REPLACE") {
      upload(action.video, action.file);
      return;
    }
    if(action.video.lessonContentId){
      // The current video DELETE only archives the storage asset. It does
      // not retire an attached published lesson-content row atomically.
      setError("This video is linked to lesson content. Remove the content and video together in the authorized lesson workspace.");
      return;
    }
    run(async signal => {
      const result=await request(`/api/courses/videos/${encodeURIComponent(action.video.id)}`, "DELETE", undefined, signal);
      if(!result || typeof result!=="object" ||
         (result as {id?:unknown}).id!==action.video.id ||
         (result as {deleted?:unknown}).deleted!==true)
        throw new Error("Could not verify the video deletion.");
      setPreviewId(current=>current===action.video.id?null:current);
      showToast({tone:"success",title:"Video deleted successfully"});
      router.refresh();
    },null,"Failed to delete");
  }
  function saveTitle(video:ManagedVideo){
    const next=(titleDraft[video.id]??video.title).trim();
    if(!next||next.length>255){setError("Enter a video title (1–255 characters).");return;}
    if(next===video.title){setInfo("Video title is unchanged.");return;}
    if(video.lessonContentId){
      setError("Video title is linked to lesson content. Edit both together after content synchronization is available.");
      return;
    }
    change(video,{title:next});
  }
  function saveDuration(video:ManagedVideo){
    const value=Number(durationDraft[video.id]??video.durationSeconds??"");
    if(!Number.isInteger(value)||value<1||value>86400){setError("Enter a duration between 1 second and 24 hours.");return;}
    if(video.lessonContentId){
      setError("Video duration is linked to lesson content. Edit both together after synchronization is available.");
      return;
    }
    change(video,{durationSeconds:value});
  }

  return <section id={"faculty-video-upload-"+lessonId} aria-label="Lesson video management" className="mt-4 min-w-0 space-y-4 border-t border-border pt-4 [overflow-wrap:anywhere]">
    <h3 className="text-base font-semibold text-[var(--lms-heading)]">Video</h3>
    <div className="flex flex-wrap items-center justify-between gap-2">
     <p className="text-xs text-muted-foreground leading-[20px]">{limitsSummary("lesson-video")}</p>
     <p role="note" className="text-xs text-muted-foreground">For videos hosted elsewhere, download an authorized copy and upload it locally. This workspace does not fetch arbitrary external URLs.</p>
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setUploadDrawerOpen(true)}
      className="min-h-11 md:min-h-9">Upload New Video</Button>
    </div>
    <Drawer open={uploadDrawerOpen} onOpenChange={open=>{if(!busy)setUploadDrawerOpen(open);}}
     title="Upload New Video" description="Choose an approved local video file. External video URL imports are retired." dismissible={!busy}
     className="w-full sm:w-[min(600px,100vw)]">
    <div className="grid min-w-0 items-end gap-3 sm:grid-cols-2">
      <label className="text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Video Title
        <Input className="mt-[6px]" value={title} maxLength={255} required placeholder="Enter Video Title"
         onChange={event=>setTitle(event.target.value)}/>
      </label>
      <label className="text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Duration (seconds, optional)
        <Input className="mt-[6px]" type="number" min={1} max={86400} value={duration} onChange={event=>setDuration(event.target.value)}/>
      </label>
      {file&&detectedVideoDuration.current?<p role="status" className="text-xs text-muted-foreground sm:col-span-2">
        Video duration detected: {detectedVideoDuration.current} seconds. You may edit this value.
      </p>:null}
      <label className="text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Points (lesson content)
        <Input className="mt-[6px]" type="number" min={0} max={1000}
          value={contentPoints} onChange={event=>setContentPoints(event.target.value)}/>
      </label>
      <label className="text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Upload Video
        <Input type="file" className="mt-[6px] block min-h-11 w-full min-w-0 text-xs md:min-h-9"
          accept={acceptAttributeFor("lesson-video")} disabled={busy}
          onChange={event=>{setFile(event.target.files?.[0]??null);event.currentTarget.value="";}}/>
      </label>
    </div>
    <div className="mt-4 flex flex-wrap justify-end gap-2">
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setUploadDrawerOpen(false)}>Cancel</Button>
     <Button type="button" size="md" loading={busy} disabled={busy||loading||!title.trim()||!file}
      onClick={()=>upload()}>Submit</Button>
    </div>
    </Drawer>
    {busy&&activeName?<div className="space-y-2" role="status">
      <p className="break-words text-sm text-body leading-[22px]">{activeName}: {progress}%</p>
      <MetricBar label="Video upload progress" role="progressbar" value={progress} maximum={100} unit="percent" className={uploadStyles["upload"] ?? ""} />
      <Button size="md" type="button" variant="secondary" onClick={()=>controllerRef.current?.abort()}>Cancel upload</Button>
    </div>:null}
    {loading?<LoadingState label="Loading videos…" />:null}
    {!loading&&videos.length===0?<EmptyState title="No videos have been added to this lesson." />:null}
    {videos.length>0?<ol className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
      {videos.map((video,index)=>{
        const state=videoProcessingDescriptor(video.processingStatus);
        const canEdit=video.deliveryId===deliveryId;
        return <li key={video.id} className="min-w-0 space-y-3 py-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
           <div className="min-w-0">
            <h4 className="break-words text-sm font-semibold text-foreground leading-[22px]">{video.title} · {formatFileSize(video.sizeBytes)}</h4>
            <p className="text-xs text-muted-foreground">Added {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(video.createdAt))}</p>
           </div>
           <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
            <StatusBadge tone="neutral">{videoPublishLabel(video.publishStatus,video.visibleToStudents)}</StatusBadge>
            <Button type="button" variant="secondary" size="sm" aria-label="Edit content" title="Edit content"
             disabled={busy||!canEdit||Boolean(video.lessonContentId)} onClick={()=>setEditingId(video.id)}>✎</Button>
            <Button type="button" variant="secondary" size="sm" aria-label="Delete content" title="Delete content"
             disabled={busy||!canEdit||Boolean(video.lessonContentId)} onClick={()=>setConfirmation({kind:"DELETE",video})}>×</Button>
           </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!facultyVideoMayPreview(video)}
              onClick={()=>setPreviewId(previous=>previous===video.id?null:video.id)}>
              Preview
            </Button>
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="primary" type="button" disabled={busy||!canEdit||video.processingStatus!=="READY"}
              onClick={()=>linkContent(video)}>
              {video.lessonContentId?"Publish to students":"Add to lesson & publish"}
            </Button>
          </div>
          <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-2">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">More video actions</summary>
            <div className="flex min-w-0 flex-wrap gap-2 pt-2">
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!canEdit||(video.publishStatus==="DRAFT"&&(!facultyVideoMayPublish(video)||!video.lessonContentId))}
              onClick={()=>change(video,{publishStatus:facultyVideoPublishAction(video)})}>
              {video.publishStatus==="PUBLISHED"?"Unpublish":video.publishStatus==="ARCHIVED"?"Restore draft":"Publish"}
            </Button>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!canEdit||video.publishStatus==="ARCHIVED"||video.processingStatus!=="READY"}
              onClick={()=>change(video,{visibleToStudents:!video.visibleToStudents})}>
              {video.visibleToStudents?"Hide from learners":"Show to learners"}
            </Button>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!canEdit||index===0}
              onClick={()=>reorder(video,-1)}>
              Move up
            </Button>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!canEdit||index===videos.length-1}
              onClick={()=>reorder(video,1)}>
              Move down
            </Button>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!canEdit||Boolean(video.lessonContentId)}
              onClick={()=>setConfirmation({kind:"DELETE",video})}>
              Delete
            </Button>
            </div>
            <div className="grid min-w-0 items-start gap-3 pt-3 sm:grid-cols-2">
            <div className="min-w-0 text-[13px] leading-4 font-semibold text-body"><label htmlFor={`video-title-${video.id}`}>Video title</label>
              <Input id={`video-title-${video.id}`} className="mt-[6px] w-full min-w-0" maxLength={255}
                disabled={busy||!canEdit||Boolean(video.lessonContentId)}
                value={titleDraft[video.id]??video.title}
                onChange={event=>setTitleDraft(old=>({...old,[video.id]:event.target.value}))}/>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button"
                disabled={busy||!canEdit||Boolean(video.lessonContentId)}
                onClick={()=>saveTitle(video)}>Update Video</Button>
            </div>
            <label className="text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Replace video
              <Input type="file" className="mt-[6px] block min-h-11 w-full min-w-0 max-w-full text-xs md:min-h-9" disabled={busy||!canEdit||!facultyVideoMayReplace(video)}
                accept={acceptAttributeFor("lesson-video")}
                onChange={event=>{const next=event.target.files?.[0];if(next)setConfirmation({kind:"REPLACE",video,file:next});event.currentTarget.value="";}}/>
            </label>
            <label className="text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Thumbnail
              <Input type="file" className="mt-[6px] block min-h-11 w-full min-w-0 max-w-full text-xs md:min-h-9" disabled={busy||!canEdit}
                accept={acceptAttributeFor("lesson-video-thumbnail")}
                onChange={event=>{thumbnail(video,event.target.files?.[0]??null);event.currentTarget.value="";}}/>
              <span className="block text-xs text-muted-foreground">{video.thumbnailStatus==="READY"?"Thumbnail ready":video.thumbnailStatus==="UPLOADING"?"Checking thumbnail":"No thumbnail"}</span>
            </label>
            <div className="min-w-0 text-[13px] leading-4 font-semibold text-body"><label htmlFor={`video-duration-${video.id}`}>Duration (seconds)</label>
              <Input disabled={busy||!canEdit||Boolean(video.lessonContentId)} id={`video-duration-${video.id}`} type="number" className="mt-[6px] w-full min-w-0" min={1} max={86400}
                value={durationDraft[video.id]??String(video.durationSeconds??"")}
                onChange={event=>setDurationDraft(draft=>({...draft,[video.id]:event.target.value}))}/>
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="md" variant="secondary" type="button" disabled={busy||!canEdit||Boolean(video.lessonContentId)} onClick={()=>saveDuration(video)}>Save duration</Button>
            </div>
          </div>

          </details>
          {!canEdit?<Alert tone="info">Shared video · read only in this Section.</Alert>:null}
          {previewId===video.id&&deliveryId?<FacultyVideoPreview key={video.id} videoId={video.id} deliveryId={deliveryId}/>:null}
          {video.lessonContentId?<Alert tone="info">
            Linked to lesson content. Deletion and separate metadata edits are unavailable until a single authorized operation can update both records safely.
          </Alert>:null}
          {video.processingStatus==="PROCESSING"?<Alert tone="warning">Checking file. Playback and publishing are not available yet.</Alert>:null}
        </li>;
      })}
    </ol>:null}
    {info?<Alert tone="success">{info}</Alert>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    <ConfirmDialog
      open={confirmation!==null}
      onOpenChange={nextOpen=>{if(!nextOpen&&!busy)setConfirmation(null);}}
      title={confirmation?.kind==="DELETE"?"Delete the video":"Replace this video?"}
      description={confirmation?.kind==="DELETE"
        ?"Are you sure to delete this video? This removes an unlinked video asset, not existing lesson content."
        :"The selected file will replace the current lesson video."}
      confirmLabel={confirmation?.kind==="DELETE"?"Yes":"Replace video"}
      confirmVariant={confirmation?.kind==="DELETE"?"danger":"primary"}
      pending={busy}
      cancelLabel={confirmation?.kind==="DELETE"?"No":"Cancel"}
      onConfirm={confirmVideoAction}
    />
    {videos.filter(video=>video.id===editingId).map(video=>{
     const editedTitle=titleDraft[video.id]??video.title;
     const editedDuration=durationDraft[video.id]??String(video.durationSeconds??"");
     const dirty=editedTitle!==video.title||editedDuration!==String(video.durationSeconds??"");
     return <Drawer key={video.id} open={true} onOpenChange={open=>{
      if(open||busy)return;
      if(dirty){setError("Save or discard the video edits before closing.");return;}
      setEditingId(null);
     }} title="Update Video" description={video.title} dismissible={!busy}
      className="w-full sm:w-[min(600px,100vw)]">
      <div className="space-y-4">
       <label className="grid gap-2 text-sm font-semibold">Video Title
        <Input maxLength={255} placeholder="Enter Video Title" value={editedTitle} disabled={busy}
         onChange={event=>setTitleDraft(old=>({...old,[video.id]:event.target.value}))}/>
       </label>
       <label className="grid gap-2 text-sm font-semibold">Duration (seconds)
        <Input type="number" min={1} max={86400} value={editedDuration} disabled={busy}
         onChange={event=>setDurationDraft(old=>({...old,[video.id]:event.target.value}))}/>
       </label>
       <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={busy} onClick={()=>{
         setTitleDraft(old=>({...old,[video.id]:video.title}));
         setDurationDraft(old=>({...old,[video.id]:String(video.durationSeconds??"")}));
         setEditingId(null);
        }}>Cancel</Button>
        <Button disabled={busy||!dirty||!editedTitle.trim()||
         (editedDuration.trim()!==""&&(!Number.isInteger(Number(editedDuration))||
          Number(editedDuration)<1||Number(editedDuration)>86400))}
         onClick={()=>{change(video,{title:editedTitle.trim(),durationSeconds:editedDuration.trim()?Number(editedDuration):null});setEditingId(null);}}>
         Submit
        </Button>
       </div>
      </div>
     </Drawer>;
    })}
  </section>;
}
