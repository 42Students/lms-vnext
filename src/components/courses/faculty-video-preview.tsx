"use client";
import { Alert } from "@/components/ui/alert";
import { PageLoading } from "@/components/ui/page-loading";

import { useEffect, useRef, useState } from "react";
import { parseLearnerPlaybackGrant, storageApiError } from "@/modules/courses/learner-storage-ui-model";

export function FacultyVideoPreview({videoId,deliveryId}:{videoId:string;deliveryId:string}){
 const videoRef=useRef<HTMLVideoElement|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();
  const video=videoRef.current;
  let timeout:ReturnType<typeof setTimeout>|null=null;
  async function grant(){
   if(!video)return;
   const previous=Number.isFinite(video.currentTime)?video.currentTime:0;
   const response=await fetch(`/api/courses/videos/${encodeURIComponent(videoId)}/playback-grant`,{
    method:"POST",credentials:"same-origin",cache:"no-store",signal:controller.signal,
    headers:{"Content-Type":"application/json"},body:JSON.stringify({deliveryId}),
   });
   if(!response.ok)throw new Error(await storageApiError(response));
   const result=parseLearnerPlaybackGrant(await response.json(),videoId,Date.now());
   if(controller.signal.aborted)return;
   video.src=result.url;
   if(result.thumbnailUrl)video.poster=result.thumbnailUrl;
   video.load();
   video.addEventListener("loadedmetadata",()=>{
    if(previous>0&&Number.isFinite(video.duration)&&video.duration>1)video.currentTime=Math.min(previous,video.duration-1);
   },{once:true});
   setLoading(false);
   timeout=setTimeout(()=>{
    void grant().catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Video preview expired.");});
   },Math.max(1000,Date.parse(result.expiresAt)-Date.now()-30_000));
  }
  void grant().catch(cause=>{if(!controller.signal.aborted){setLoading(false);setError(cause instanceof Error?cause.message:"Video preview unavailable.");}});
  return()=>{controller.abort();if(timeout)clearTimeout(timeout);if(video){video.pause();video.removeAttribute("src");video.removeAttribute("poster");video.load();}};
 },[videoId,deliveryId]);
 return <section aria-label="Video preview" className="space-y-2">
  {loading?<PageLoading label="Preparing video preview" variant="card" count={1} />:null}
  <video ref={videoRef} controls preload="metadata" className="aspect-video w-full max-w-2xl rounded-[var(--lms-control-radius)] bg-foreground"/>
  {error?<Alert tone="error">{error}</Alert>:null}
 </section>;
}
