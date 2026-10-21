"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Preview = {
  title: string;
  course: string;
  lesson: string;
  type: string;
  status: string;
  scope: string;
  visible: boolean;
  details: string;
};

export function CollegeContentPreview({ data, playback=null }: {
  data: Preview;
  playback?:{videoId:string;deliveryId:string}|null;
}) {
  const [open, setOpen] = useState(false);
  const [videoUrl,setVideoUrl]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [videoError,setVideoError]=useState<string|null>(null);
  async function viewVideo(){
    if(!playback||loading)return;
    setLoading(true);setVideoError(null);setVideoUrl(null);
    try{
      const response=await fetch("/api/courses/videos/"+encodeURIComponent(playback.videoId)+"/playback-grant",{
        method:"POST",headers:{"Content-Type":"application/json"},
        cache:"no-store",body:JSON.stringify({deliveryId:playback.deliveryId}),
      });
      const result=await response.json().catch(()=>null);
      if(!response.ok||typeof result?.grant?.url!=="string")
        throw Error("Unable to prepare secure playback. Try again.");
      setVideoUrl(result.grant.url);
    }catch(error){
      setVideoError(error instanceof Error?error.message:"Unable to open video.");
    }finally{setLoading(false);}
  }
  const fields = [
    ["Course", data.course],
    ["Lesson", data.lesson],
    ["Content type", data.type],
    ["Status", data.status],
    ["Audience", data.scope],
    ["Students", data.visible ? "Visible when published" : "Hidden"],
    ["Details", data.details],
  ] as const;

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="min-h-11 md:min-h-9"
      >
        Preview
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{setOpen(next);if(!next){setVideoUrl(null);setVideoError(null);}}}
        title={data.title}
        description="Content preview"
        footer={
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            className="min-h-11 w-full md:min-h-9 md:w-auto"
          >
            Close preview
          </Button>
        }
      >
        <dl
          aria-label="Content preview"
          className="grid min-w-0 grid-cols-1 gap-x-[var(--lms-space-6)] text-sm text-body md:grid-cols-2"
        >
          {fields.map(([label, value]) => (
            <div
              key={label}
              className={
                label === "Details"
                  ? "grid min-w-0 grid-cols-1 gap-y-1 border-b border-border py-3 md:col-span-2"
                  : "grid min-w-0 grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-x-3 border-b border-border py-3 md:block"
              }
            >
              <dt className="min-w-0 font-semibold text-foreground">{label}</dt>
              <dd className="min-w-0 break-words [overflow-wrap:anywhere] md:mt-1">
                {label === "Status" ? (
                  <StatusBadge
                    tone={value === "PUBLISHED" ? "success" : value === "ARCHIVED" ? "neutral" : "warning"}
                  >
                    {value}
                  </StatusBadge>
                ) : label === "Students" ? (
                  <StatusBadge tone={data.visible ? "success" : "neutral"}>{value}</StatusBadge>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
        {playback?<div className="mt-4 space-y-3">
          <Button type="button" variant="secondary" onClick={viewVideo} disabled={loading}>
            {loading?"Preparing video…":"View stored video"}
          </Button>
          {videoError?<p role="alert" className="text-sm text-[var(--lms-error)]">{videoError}</p>:null}
          {videoUrl?<video controls playsInline preload="metadata" src={videoUrl}
            className="aspect-video w-full rounded-[var(--lms-control-radius)] bg-black"
            aria-label={"Playback "+data.title}/>:null}
        </div>:null}
        {data.type==="VIDEO"&&!playback?<p className="mt-3 text-xs text-muted-foreground">
          An old video key requires verified private-storage migration before playback can be granted.
        </p>:null}
        <p className="mt-[var(--lms-space-4)] text-xs text-muted-foreground">
          Scoped metadata only until a secure playback grant is requested. Private keys and meeting links are not exposed.
        </p>
      </Dialog>
    </>
  );
}
