"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { apiFetch } from "@/lib/api-fetch";
import {courseThumbnailUrlSchema} from "@/modules/courses/validation";
import type {LegacyCourseMetadataField} from "@/modules/courses/legacy-course-metadata-preview";

type CourseMetadata = {
 id:string;name:string;code:string;shortTitle:string|null;
 officialCode:string|null;cardColor:string|null;description:string|null;
 updatedAt:string;legacyFields?:LegacyCourseMetadataField[];
};
type Display = {
  introductionText: string | null;
  bodyHtml: string | null;
  takeaways: string[];
  thumbnailUrl: string | null;
  version: number;
} | null;

export function AdminCourseDisplayEditor({
  courseId,
  enabled,
  initial,
}: {
  courseId: string;
  enabled: boolean;
  initial: Display;
}) {
  const router = useRouter();
  const [metadata,setMetadata]=useState<CourseMetadata|null>(null);
  const [metadataError,setMetadataError]=useState("");
  const [name,setName]=useState("");
  const [code,setCode]=useState("");
  const [shortTitle,setShortTitle]=useState("");
  const [officialCode,setOfficialCode]=useState("");
  const [cardColor,setCardColor]=useState("");
  const [description,setDescription]=useState("");
  const [reloadKey,setReloadKey]=useState(0);
  const [savedVersion,setSavedVersion]=useState(initial?.version??null);
  const [savedDisplay,setSavedDisplay]=useState(initial);
  const { showToast } = useToast();
  const {pending,run:guardedRun}=useGuardedAction();
  const [introductionText, setIntroductionText] =
    useState(initial?.introductionText ?? "");
  const [bodyHtml, setBodyHtml] =
    useState(initial?.bodyHtml ?? "");
  const [takeaways, setTakeaways] =
    useState(
      (initial?.takeaways ?? []).join("\n"),
    );
  const [thumbnailUrl, setThumbnailUrl] =
    useState(initial?.thumbnailUrl ?? "");
  const [imageFile,setImageFile]=useState<File|null>(null);
  const [imageBusy,setImageBusy]=useState(false);
  const [imageError,setImageError]=useState("");
  const [imagePending,setImagePending]=useState<{receiptId:string;status:string}|null>(null);
  const courseImageUrl="/api/courses/"+encodeURIComponent(courseId)+"/image";
  const uploadedThumbnail=thumbnailUrl===courseImageUrl;

  useEffect(()=>{
    if(!enabled)return;
    const controller=new AbortController();
    void fetch(courseImageUrl+"/status",{cache:"no-store",credentials:"same-origin",
      signal:controller.signal}).then(async response=>{
      if(!response.ok)return;
      const payload:unknown=await response.json();
      if(!payload||typeof payload!=="object"||!("image" in payload))return;
      const state=(payload as {image?:{pending?:{receiptId:string;status:string}|null}}).image;
      if(!controller.signal.aborted)
        setImagePending(state?.pending
          ?{receiptId:state.pending.receiptId,status:state.pending.status}:null);
    }).catch(()=>{/* A missing status route never enables an unverified image. */});
    return ()=>controller.abort();
  },[courseImageUrl,enabled]);

  async function refreshDisplayAfterImage(nextUrl:string){
    const result=await apiFetch<{display:Display}>(
      "/api/courses/"+encodeURIComponent(courseId)+"/display");
    setSavedDisplay(result.display);
    setSavedVersion(result.display?.version??null);
    setThumbnailUrl(nextUrl);
    router.refresh();
  }
  async function completeImage(receiptId:string){
    const result=await apiFetch<{image:{status:"READY"|"VERIFYING";imageUrl:string|null}}>(
      courseImageUrl+"/complete",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({receiptId}),
      });
    if(result.image.status==="READY"){
      setImagePending(null);setImageFile(null);
      await refreshDisplayAfterImage(result.image.imageUrl??courseImageUrl);
      showToast({tone:"success",title:"Course image uploaded",
        description:"The verified image is now available in Course Home."});
    }else{
      setImagePending({receiptId,status:"VERIFYING"});
      showToast({tone:"info",title:"Checking file",
        description:"The image will remain private until verification finishes."});
    }
  }
  async function uploadImage(){
    if(!imageFile||imageBusy||pending)return;
    if(!["image/jpeg","image/png","image/webp"].includes(imageFile.type)||
      imageFile.size<1||imageFile.size>5*1024*1024){
      setImageError("Choose a JPEG, PNG or WebP image no larger than 5 MiB.");return;
    }
    setImageBusy(true);setImageError("");
    try{
      const result=await apiFetch<{grant:{
        receiptId:string;method:"PUT";uploadUrl:string;expiresAt:string;
        requiredHeaders:Record<string,string>;
      }}>(courseImageUrl,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({originalName:imageFile.name,contentType:imageFile.type,
          sizeBytes:imageFile.size}),
      });
      setImagePending({receiptId:result.grant.receiptId,status:"UPLOADING"});
      const reply=await fetch(result.grant.uploadUrl,{
        method:"PUT",body:imageFile,headers:result.grant.requiredHeaders,
        credentials:"omit",cache:"no-store",
      });
      if(!reply.ok)throw new Error("Image upload failed. Select the file and try again.");
      await completeImage(result.grant.receiptId);
    }catch(error){
      setImageError(error instanceof Error?error.message:"Image upload failed.");
    }finally{setImageBusy(false);}
  }
  async function checkImage(){
    if(!imagePending||imageBusy)return;
    setImageBusy(true);setImageError("");
    try{await completeImage(imagePending.receiptId);}
    catch(error){setImageError(error instanceof Error?error.message:
      "Image verification could not be completed.");}
    finally{setImageBusy(false);}
  }
  async function removeUploadedImage(){
    if(imageBusy||pending)return;
    setImageBusy(true);setImageError("");
    try{
      await apiFetch(courseImageUrl,{method:"DELETE"});
      setImagePending(null);setImageFile(null);
      await refreshDisplayAfterImage("");
      showToast({tone:"success",title:"Course image removed"});
    }catch(error){setImageError(error instanceof Error?error.message:
      "The image could not be removed.");}
    finally{setImageBusy(false);}
  }

  useEffect(()=>{
    const controller=new AbortController();
    void fetch("/api/courses/"+encodeURIComponent(courseId)+"/display-meta",{
      cache:"no-store",credentials:"same-origin",signal:controller.signal,
    }).then(async response=>{
      if(!response.ok)throw Error("Course details could not be loaded.");
      return response.json() as Promise<{metadata:CourseMetadata}>;
    }).then(payload=>{
      if(controller.signal.aborted)return;
      const course=payload.metadata;
      setMetadata(course);setMetadataError("");
      setName(course.name);setCode(course.code);
      setShortTitle(course.shortTitle??"");
      setOfficialCode(course.officialCode??"");
      setCardColor(course.cardColor??"");
      setDescription(course.description??"");
    }).catch(()=>{if(!controller.signal.aborted)setMetadataError("Course details could not be loaded.");});
    return ()=>controller.abort();
  },[courseId,reloadKey]);

  const metadataDirty=Boolean(metadata&&(
   name!==metadata.name||code!==metadata.code||
   shortTitle!==(metadata.shortTitle??"")||
   officialCode!==(metadata.officialCode??"")||
   cardColor!==(metadata.cardColor??"")||
   description!==(metadata.description??"")
  ));
  function save() {
    void guardedRun(async () => {
      try {
        if(metadataDirty&&metadata){
          await apiFetch(`/api/courses/${courseId}`,{
            method:"PATCH",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              expectedUpdatedAt:metadata.updatedAt,
              ...(name!==metadata.name?{name:name.trim()}:{}),
              ...(code!==metadata.code?{code:code.trim()}:{}),
              ...(shortTitle!==(metadata.shortTitle??"")?{shortTitle:shortTitle.trim()||name.trim().slice(0,255)}:{}),
              ...(officialCode!==(metadata.officialCode??"")?{officialCode:officialCode.trim()||null}:{}),
              ...(cardColor!==(metadata.cardColor??"")?{cardColor:cardColor.trim()||null}:{}),
              ...(description!==(metadata.description??"")?{description:description.trim()||null}:{}),
            }),
          });
          setReloadKey(k=>k+1);
        }
        if(dirty){
        await apiFetch<{display?:{version:number}}>(
          `/api/courses/${courseId}/display`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              introductionText:
                introductionText.trim() ||
                null,
              bodyHtml:
                bodyHtml.trim() || null,
              takeaways: takeaways
                .split(/\r?\n/)
                .map((item) =>
                  item
                    .replace(
                      /^\s*(?:[-*•]\s+|\d+[.)]\s+)/,
                      "",
                    )
                    .trim(),
                )
                .filter(Boolean),
              thumbnailUrl:
                thumbnailUrl.trim() ||
                null,
              expectedVersion:
                savedVersion,
            }),
          },
        ).then(result=>{
          if(typeof result?.display?.version==="number")setSavedVersion(result.display.version);
          setSavedDisplay({introductionText:introductionText.trim()||null,bodyHtml:bodyHtml.trim()||null,
            thumbnailUrl:thumbnailUrl.trim()||null,version:result?.display?.version??savedVersion??0,
            takeaways:takeaways.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)});
        });
        }
        showToast({
          tone: "success",
          title:
            "Course details updated",
          description:
            "Course information and Course Home changes have been saved.",
        });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title:
            "Course details could not be fully saved",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  const dirty =
    introductionText !== (savedDisplay?.introductionText ?? "") ||
    bodyHtml !== (savedDisplay?.bodyHtml ?? "") ||
    takeaways !== (savedDisplay?.takeaways ?? []).join("\n") ||
    thumbnailUrl !== (savedDisplay?.thumbnailUrl ?? "");
  const metadataIssue=Boolean(metadata&&(!name.trim()||!code.trim()||shortTitle.length>255||officialCode.length>40||
    Boolean(cardColor.trim()&&!/^#[a-f0-9]{6}$/i.test(cardColor.trim()))));
  const thumbnailIssue = Boolean(
    thumbnailUrl.trim() && !uploadedThumbnail && !courseThumbnailUrlSchema.safeParse(thumbnailUrl.trim()).success,
  );

  if (!enabled) {
    return (
      <section className="min-w-0" aria-label="Course Home content">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
            Course Home content
          </h3>
          <StatusBadge tone="warning">Migration pending</StatusBadge>
        </div>
        <p className="mt-2 max-w-prose break-words text-sm leading-[22px] text-body">
          Rich introduction, ordered takeaways and Course thumbnail are staged
          but cannot be persisted until the DB05 migration is verified. The
          existing Course description remains the learner-safe fallback.
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0" aria-label="Course Home content" aria-busy={pending}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
            Course Home content
          </h3>
          <p className="mt-1 max-w-prose text-xs leading-5 text-muted-foreground">
            Shared public Course overview.
          </p>
        </div>
        <StatusBadge tone="success">DB05 verified</StatusBadge>
      </div>

      {metadataError?<div className="flex items-center gap-2" role="alert">
        <span className="text-sm text-error">{metadataError}</span>
        <Button type="button" variant="secondary" onClick={()=>setReloadKey(k=>k+1)}>Retry</Button>
      </div>:null}
      {metadata?<div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Course Name
          <Input value={name} maxLength={255} required disabled={pending} onChange={e=>setName(e.target.value)}/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Official Course Code
          <Input value={code} maxLength={64} required disabled={pending} onChange={e=>setCode(e.target.value)}/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Short display name
          <Input value={shortTitle} maxLength={255} disabled={pending} onChange={e=>setShortTitle(e.target.value)}/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Official code (catalogue)
          <Input value={officialCode} maxLength={40} disabled={pending} onChange={e=>setOfficialCode(e.target.value)}/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Course color
          <Input value={cardColor} maxLength={16} placeholder="#1677FF" disabled={pending} onChange={e=>setCardColor(e.target.value)}/>
        </label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Course description
          <Textarea value={description} maxLength={5000} rows={3} disabled={pending} onChange={e=>setDescription(e.target.value)}/>
        </label>
      </div>:null}
      {metadata?.legacyFields?.some(field=>field.status!=="MISSING")?<Disclosure
        title="Imported legacy course metadata" className="mt-4 min-w-0"
        contentClassName="space-y-3 pt-3">
        <p className="text-xs text-muted-foreground">
          Historical display fields are read-only. Missing, explicitly empty and saved values
          remain distinct; imported HTML is shown as text, never executed.
          These fields do not grant learner access.
        </p>
        <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
          {metadata.legacyFields.map(field=><div key={field.key} className="min-w-0 border-b border-border py-2">
            <dt className="text-xs font-semibold text-muted-foreground">{field.key}</dt>
            <dd className="mt-1 break-words text-sm [overflow-wrap:anywhere]">{field.status==="MISSING"
              ?"Not imported":field.status==="NULL"?"Explicit null":field.value}</dd>
            <dd className="mt-1 break-words text-xs text-muted-foreground">{field.target}</dd>
          </div>)}
        </dl>
      </Disclosure>:null}
      <div className="mt-[var(--lms-space-4)] grid min-w-0 max-w-[920px] gap-[var(--lms-space-4)]">
        <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] text-[13px] leading-4">
          Introduction
          <Input
            className="mt-[var(--lms-space-2)] w-full"
            value={introductionText}
            maxLength={500}
            placeholder="One-line hook for the Course Home page"
            disabled={pending}
            onChange={(event) => setIntroductionText(event.target.value)}
          />
        </label>

        <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] text-[13px] leading-4">
          What learners will take away
          <Textarea
            className="mt-[var(--lms-space-2)] min-h-32 w-full"
            value={takeaways}
            maxLength={15000}
            placeholder={"One point per line\nUnderstand the core concepts\nApply them in practice"}
            disabled={pending}
            onChange={(event) => setTakeaways(event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
            Order is preserved. Bullet and numbered prefixes are removed.
          </span>
        </label>

        <Disclosure
          title="Advanced formatting and thumbnail"
          defaultOpen={Boolean(initial?.bodyHtml || initial?.thumbnailUrl)}
          className="min-w-0"
          contentClassName="grid min-w-0 gap-[var(--lms-space-4)] px-[var(--lms-space-2)] pt-2"
        >
          <p className="m-0 max-w-prose text-xs leading-5 text-muted-foreground">
            Rich HTML is sanitized to a strict attribute-free formatting allowlist before storage.
          </p>
          <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] text-[13px] leading-4">
            Rich description HTML
            <Textarea
              className="mt-[var(--lms-space-2)] min-h-40 w-full font-mono text-[var(--lms-font-base)]"
              value={bodyHtml}
              maxLength={20000}
              placeholder="<p>Describe the course...</p>"
              disabled={pending}
              onChange={(event) => setBodyHtml(event.target.value)}
            />
            <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
              Scripts, images, links, attributes and unknown tags are escaped or
              stripped; simple formatting/list/table tags are retained.
            </span>
          </label>
          <div className="min-w-0 space-y-3">
            <h4 className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">Course image</h4>
            <p className="text-xs leading-5 text-muted-foreground">
              Choose a JPEG, PNG or WebP image up to 5 MiB. Upload directly to private storage,
              then check the receipt before it appears in the course.
            </p>
            <label className="grid min-w-0 gap-2 text-sm font-semibold">
              Upload image
              <input type="file" accept="image/jpeg,image/png,image/webp"
                className="block w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border p-2 text-sm"
                disabled={pending||imageBusy}
                onChange={event=>{setImageFile(event.currentTarget.files?.[0]??null);
                  setImageError("");}}/>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={!imageFile||pending||imageBusy}
                loading={imageBusy} onClick={()=>void uploadImage()}>
                {imageBusy?"Working…":"Upload image"}
              </Button>
              {imagePending?<Button type="button" variant="secondary"
                disabled={imageBusy||pending} onClick={()=>void checkImage()}>
                Check verification
              </Button>:null}
            </div>
            {imagePending?<p role="status" className="text-xs text-muted-foreground">
              {imagePending.status==="VERIFYING"
                ?"Checking file. The image is not available until verified."
                :"Upload receipt issued. Complete the upload to make the image available."}
            </p>:null}
            {imageError?<p role="alert" className="text-sm text-error">{imageError}</p>:null}
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Thumbnail URL (legacy HTTPS link or uploaded image)
              <Input className="w-full" type={uploadedThumbnail?"text":"url"}
                inputMode="url" value={thumbnailUrl} error={thumbnailIssue}
                aria-describedby={thumbnailIssue?"course-thumbnail-issue":undefined}
                placeholder="https://..." disabled={pending||imageBusy||uploadedThumbnail}
                onChange={event=>setThumbnailUrl(event.target.value)}/>
            </label>
            {thumbnailUrl.trim()&&!thumbnailIssue?(
              <div className="min-w-0 space-y-2">
                {/* The active private route never leaks a bucket/object key or signed URL. */}
                <img src={thumbnailUrl.trim()} width={240} height={140}
                  alt="Course thumbnail preview" loading="lazy"
                  className="max-h-40 max-w-full rounded-[var(--lms-control-radius)] border border-border object-contain"/>
                <div className="flex flex-wrap items-center gap-2">
                  {uploadedThumbnail?<Button type="button" size="sm" variant="secondary"
                    disabled={pending||imageBusy} onClick={()=>void removeUploadedImage()}>
                    Remove image
                  </Button>:
                  <Button type="button" size="sm" variant="secondary" disabled={pending||imageBusy}
                    onClick={()=>setThumbnailUrl("")}>Remove image</Button>}
                </div>
              </div>
            ):null}
            {thumbnailIssue?<span id="course-thumbnail-issue"
              className="block text-xs font-normal text-[var(--lms-error-text)]">
              Enter an HTTPS thumbnail URL or upload a verified course image.
            </span>:null}
            <p className="text-xs font-normal leading-5 text-muted-foreground">
              Private images require the selected college membership and a verified
              upload receipt. In production, scanner-pending images remain hidden.
              Legacy price, category and enrollment dates are not active Course Home fields.
            </p>
          </div>
        </Disclosure>
      </div>

      <div className="mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-2 border-t border-border pt-[var(--lms-space-4)] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted-foreground" role="status">
          {dirty||metadataDirty ? "Unsaved changes" : "No unsaved changes"}
        </span>
        <Button
          type="button"
          className="w-full sm:w-auto"
          loading={pending}
          disabled={pending || imageBusy || (!dirty && !metadataDirty) || thumbnailIssue || metadataIssue || Boolean(metadataError)}
          onClick={save}
        >
          {pending ? "Saving…" : "Save Course"}
        </Button>
      </div>
    </section>
  );
}
