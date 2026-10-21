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

type CourseMetadata = {
 id:string;name:string;code:string;shortTitle:string|null;
 officialCode:string|null;cardColor:string|null;description:string|null;
 updatedAt:string;
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
              ...(shortTitle!==(metadata.shortTitle??"")?{shortTitle:shortTitle.trim()||name.trim().slice(0,64)}:{}),
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
  const metadataIssue=Boolean(metadata&&(!name.trim()||!code.trim()||shortTitle.length>64||officialCode.length>40||
    Boolean(cardColor.trim()&&!/^#[a-f0-9]{6}$/i.test(cardColor.trim()))));
  const thumbnailIssue = Boolean(
    thumbnailUrl.trim() && !/^https:\/\//i.test(thumbnailUrl.trim()),
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
          <Input value={shortTitle} maxLength={64} disabled={pending} onChange={e=>setShortTitle(e.target.value)}/>
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
          <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] text-[13px] leading-4">
            Thumbnail URL
            <Input
              className="mt-[var(--lms-space-2)] w-full"
              type="url"
              inputMode="url"
              value={thumbnailUrl}
              error={thumbnailIssue}
              aria-describedby={thumbnailIssue ? "course-thumbnail-issue" : undefined}
              placeholder="https://..."
              disabled={pending}
              onChange={(event) => setThumbnailUrl(event.target.value)}
            />
            {thumbnailUrl.trim()&&!thumbnailIssue?(
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a href={thumbnailUrl.trim()} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary-text underline">Preview thumbnail</a>
                <Button type="button" size="sm" variant="secondary" disabled={pending}
                  onClick={()=>setThumbnailUrl("")}>Remove image</Button>
              </div>
            ):null}
            {thumbnailIssue ? (
              <span id="course-thumbnail-issue" className="mt-1 block text-xs font-normal text-[var(--lms-error-text)]">
                Enter an HTTPS thumbnail URL.
              </span>
            ) : null}
            <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
              HTTPS only. Upload-backed thumbnails require a verified private
              storage grant and must not be replaced by an untracked object URL.
              Legacy price, category and enrollment dates are not active Course Home fields.
            </span>
          </label>
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
          disabled={pending || (!dirty && !metadataDirty) || thumbnailIssue || metadataIssue || Boolean(metadataError)}
          onClick={save}
        >
          {pending ? "Saving…" : "Save Course"}
        </Button>
      </div>
    </section>
  );
}
