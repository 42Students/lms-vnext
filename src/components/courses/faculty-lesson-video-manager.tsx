"use client";
import {Input} from "@/components/ui/input";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
type LessonContent = { id:string; contentType:string; storageKey:string|null; status:string; lessonId:string; deliveryId:string|null };
export function FacultyLessonVideoManager({
  lessonId,deliveryId,nextContentSequence,
}: { lessonId:string;deliveryId:string|null;nextContentSequence:number }) {
  const router=useRouter();
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
  const [durationDraft,setDurationDraft]=useState<Record<string,string>>({});
  const [titleDraft,setTitleDraft]=useState<Record<string,string>>({});
  const [previewId,setPreviewId]=useState<string|null>(null);
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
      catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Could not load videos.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    }
    void load();
    return()=>{controller.abort();controllerRef.current?.abort();};
  },[lessonId,deliveryId]);

  function run(action:Action,name:string|null=null){
    if(locked.current)return;
    locked.current=true;
    const controller=new AbortController();
    controllerRef.current=controller;
    setBusy(true);setActiveName(name);setProgress(0);setError(null);setInfo(null);
    void (async()=>{
      try{await action(controller.signal);}
      catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Could not update lesson video.");}
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
      setFile(null);setTitle("");setDuration("");
      setInfo(result.processingStatus==="READY"?"Video upload completed.":"Video uploaded. Processing is not complete yet.");
      router.refresh();
    },chosen.name);
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
    if(!Number.isInteger(points)||points<0||points>1000){setError("Enter Points from 0 to 1000.");return;}
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
  function saveTitle(video:ManagedVideo){
    const next=(titleDraft[video.id]??video.title).trim();
    if(!next||next.length>255){setError("Enter a video title (1–255 characters).");return;}
    if(next===video.title){setInfo("Video title is unchanged.");return;}
    change(video,{title:next});
  }
  function saveDuration(video:ManagedVideo){
    const value=Number(durationDraft[video.id]??video.durationSeconds??"");
    if(!Number.isInteger(value)||value<1||value>86400){setError("Enter a duration between 1 second and 24 hours.");return;}
    change(video,{durationSeconds:value});
  }

  return <section aria-label="Lesson video management" className="mt-4 space-y-3 border-t border-border pt-4">
    <h3 className="text-base font-semibold text-[var(--lms-heading)]">Video</h3>
    <p className="text-xs text-muted-foreground">{limitsSummary("lesson-video")}</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-semibold text-body">Title
        <Input className="mt-1" value={title} maxLength={255} onChange={event=>setTitle(event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-body">Duration (seconds, optional)
        <Input className="mt-1" type="number" min={1} max={86400} value={duration} onChange={event=>setDuration(event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-body">Points (lesson content)
        <Input className="mt-1" type="number" min={0} max={1000}
          value={contentPoints} onChange={event=>setContentPoints(event.target.value)}/>
      </label>
      <label className="text-sm font-semibold text-body">Upload Video
        <Input type="file" className="mt-1 min-h-11 w-full text-xs"
          accept={acceptAttributeFor("lesson-video")} disabled={busy}
          onChange={event=>{setFile(event.target.files?.[0]??null);event.currentTarget.value="";}}/>
      </label>
    </div>
    <Button type="button" size="sm" disabled={busy||loading||!title.trim()||!file} onClick={()=>upload()}>
      Upload video
    </Button>
    {busy&&activeName?<div className="space-y-2" role="status">
      <p className="break-words text-sm text-body">{activeName}: {progress}%</p>
      <progress className="h-2 w-full" aria-label="Video upload progress" value={progress} max={100}/>
      <Button size="sm" type="button" variant="secondary" onClick={()=>controllerRef.current?.abort()}>Cancel upload</Button>
    </div>:null}
    {loading?<p role="status" className="text-sm text-muted-foreground">Loading videos…</p>:null}
    {!loading&&videos.length===0?<p role="status" className="text-sm text-muted-foreground">No videos have been added to this lesson.</p>:null}
    <ol className="space-y-3">
      {videos.map((video,index)=>{
        const state=videoProcessingDescriptor(video.processingStatus);
        const canEdit=video.deliveryId===deliveryId;
        return <li key={video.id} className="space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 break-words text-sm font-semibold text-foreground">{video.title} · {formatFileSize(video.sizeBytes)}</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
              <StatusBadge tone="neutral">{videoPublishLabel(video.publishStatus,video.visibleToStudents)}</StatusBadge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" type="button" disabled={busy||!facultyVideoMayPreview(video)}
              onClick={()=>setPreviewId(previous=>previous===video.id?null:video.id)}>
              Preview
            </Button>
            <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit||(video.publishStatus==="DRAFT"&&(!facultyVideoMayPublish(video)||!video.lessonContentId))}
              onClick={()=>change(video,{publishStatus:facultyVideoPublishAction(video)})}>
              {video.publishStatus==="PUBLISHED"?"Unpublish":video.publishStatus==="ARCHIVED"?"Restore draft":"Publish"}
            </Button>
            <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit||video.publishStatus==="ARCHIVED"||video.processingStatus!=="READY"}
              onClick={()=>change(video,{visibleToStudents:!video.visibleToStudents})}>
              {video.visibleToStudents?"Hide from learners":"Show to learners"}
            </Button>
            <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit||index===0}
              onClick={()=>reorder(video,-1)}>
              Move up
            </Button>
            <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit||index===videos.length-1}
              onClick={()=>reorder(video,1)}>
              Move down
            </Button>
            <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit||video.processingStatus!=="READY"}
              onClick={()=>linkContent(video)}>
              {video.lessonContentId?"Publish to students":"Add to lesson & publish"}
            </Button>
            <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit}
              onClick={()=>{if(window.confirm("Delete this video?"))run(async signal=>{
                await request(`/api/courses/videos/${encodeURIComponent(video.id)}`,"DELETE",undefined,signal);
                router.refresh();
              });}}>
              Delete
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-semibold text-body">Video title
              <Input className="mt-1 min-w-44" maxLength={255}
                disabled={busy||!canEdit}
                value={titleDraft[video.id]??video.title}
                onChange={event=>setTitleDraft(old=>({...old,[video.id]:event.target.value}))}/>
              <Button size="sm" variant="secondary" type="button"
                disabled={busy||!canEdit}
                onClick={()=>saveTitle(video)}>Update Video</Button>
            </label>
            <label className="text-xs font-semibold text-body">Replace video
              <Input type="file" className="mt-1 min-h-11 max-w-full text-xs" disabled={busy||!canEdit||!facultyVideoMayReplace(video)}
                accept={acceptAttributeFor("lesson-video")}
                onChange={event=>{const next=event.target.files?.[0];if(next&&window.confirm("Replace this video?"))upload(video,next);event.currentTarget.value="";}}/>
            </label>
            <label className="text-xs font-semibold text-body">Thumbnail
              <Input type="file" className="mt-1 min-h-11 max-w-full text-xs" disabled={busy||!canEdit}
                accept={acceptAttributeFor("lesson-video-thumbnail")}
                onChange={event=>{thumbnail(video,event.target.files?.[0]??null);event.currentTarget.value="";}}/>
              <span className="block text-xs text-muted-foreground">{video.thumbnailStatus==="READY"?"Thumbnail ready":video.thumbnailStatus==="UPLOADING"?"Checking thumbnail":"No thumbnail"}</span>
            </label>
            <label className="text-xs font-semibold text-body">Duration (seconds)
              <Input type="number" className="mt-1 w-28" min={1} max={86400}
                value={durationDraft[video.id]??String(video.durationSeconds??"")}
                onChange={event=>setDurationDraft(draft=>({...draft,[video.id]:event.target.value}))}/>
              <Button size="sm" variant="secondary" type="button" disabled={busy||!canEdit} onClick={()=>saveDuration(video)}>Save duration</Button>
            </label>
          </div>
          {!canEdit?<p role="status" className="text-xs text-muted-foreground">Shared video · read only in this Section.</p>:null}
          {previewId===video.id&&deliveryId?<FacultyVideoPreview key={video.id} videoId={video.id} deliveryId={deliveryId}/>:null}
          {video.lessonContentId?<p className="text-xs text-muted-foreground">Linked to lesson content</p>:null}
          {video.processingStatus==="PROCESSING"?<p role="status" className="text-xs text-muted-foreground">Checking file. Playback and publishing are not available yet.</p>:null}
        </li>;
      })}
    </ol>
    {info?<p role="status" className="text-sm text-body">{info}</p>:null}
    {error?<p role="alert" className="text-sm font-semibold text-error">{error}</p>:null}
  </section>;
}
