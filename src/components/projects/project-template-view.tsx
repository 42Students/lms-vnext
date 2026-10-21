"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {projectTemplateSectionCounts} from "@/modules/projects/project-template-catalogue-model";

type Entry=Record<string,unknown>;
const object=(value:unknown):Entry=>
 value&&typeof value==="object"&&!Array.isArray(value)?value as Entry:{};
/** Legacy blueprint JSON may arrive as a string or as an object; preserve
 * unknown overview/delivery fields for inspectable read-only parity.
 * Never evaluate code or inject parsed values as HTML. */
function normalizedBlueprint(value:unknown):Entry{
 if(typeof value==="string"){
  if(value.length>300_000)return {};
  try{return object(JSON.parse(value) as unknown);}catch{return {};}
 }
 return object(value);
}
const nonblank=(value:unknown):string=>
 typeof value==="string"?value.trim():"";
function displayLabel(value:unknown):string{
 if(typeof value==="string")return value.trim()||"—";
 if(typeof value==="number"&&Number.isFinite(value))return String(value);
 const record=object(value);
 return nonblank(record.title)||nonblank(record.name)||nonblank(record.label)||
  nonblank(record.key)||"—";
}
function rowsFor(value:unknown):readonly unknown[]{
 return Array.isArray(value)?value:[];
}
function tag(value:string,index:number){
 return <Badge key={index} tone="neutral" className="max-w-full border border-border bg-muted px-2 py-0.5 text-xs text-body">{value}</Badge>;
}
function templateCard(title:string,body:unknown,isOverview=false){
 const rows=rowsFor(body);
 const overview=normalizedBlueprint(body);
 const allowed=isOverview?Object.entries(overview)
   .filter(([,value])=>value!==null&&value!==undefined&&value!==""):[];
 return <section aria-label={title} className="min-w-0 rounded-[8px] border border-[var(--lms-canvas-border)] bg-surface px-4 py-3">
  <h2 className="mb-3 text-base font-semibold text-[var(--lms-heading)]">{title}</h2>
  {isOverview?allowed.length?
   <dl className="min-w-0 overflow-hidden rounded border border-border text-sm">
    {allowed.map(([key,value])=><div key={key} className="grid min-w-0 border-b border-border last:border-b-0 sm:grid-cols-[165px_minmax(0,1fr)]">
     <dt className="bg-muted px-3 py-2 font-semibold text-body">{key==="goal"?"Goal":key==="deliverables"?"Deliverables":key}</dt>
     <dd className="min-w-0 px-3 py-2 break-words">
      {Array.isArray(value)?<div className="flex min-w-0 flex-wrap gap-2">
       {value.map((item,index)=>tag(displayLabel(item),index))}
      </div>:typeof value==="object"?JSON.stringify(value).slice(0,1200):
       typeof value==="string"?value:String(value)}
     </dd>
    </div>)}
   </dl>:<p className="text-sm text-muted-foreground">No overview provided.</p>
  :rows.length?
   <div className="flex min-w-0 flex-wrap gap-2">
    {rows.map((item,index)=>tag(displayLabel(item),index))}
   </div>:<p className="text-sm text-muted-foreground">No {title.toLowerCase()} configured</p>}
 </section>;
}

/** Read-only legacy summary of the immutable published blueprint.
 * Render only Goal and Deliverables as Overview fields, consistent with
 * the central count, but retain vNext extras below the four legacy cards.
 * Legacy name/label/title array rows are descriptive, never executable.
 */
type ProjectTemplateBlueprintView = {
  legacy?: {
    courseLabel?:string|null;phase?:string|null;status?:string|null;
    lifecycleStatus?:string|null;
  };
  submission?: {instructions?:string;requiredEvidence?:readonly string[]};
  overview?: {
    goal?:string;description?:string;courseLabel?:string;phase?:string;
    submissionType?:string;submissionInstructions?:string;
    deliverables?:readonly string[];definitionOfDone?:readonly string[];
    personas?:readonly string[];
  };
  releases?: readonly {
    key?: string;
    title?: string;
    description?: string;
  }[];
  sprints?: readonly {
    key?: string;
    title?: string;
    description?: string;
    releaseKey?: string;
  }[];
  tasks?: readonly {
    key?: string;
    title?: string;
    description?: string;
    sprintKey?: string;
    priority?: string;
  }[];
  resources?: readonly {
    key?: string;
    title?: string;
    description?: string;
    url?: string | null;
    required?: boolean;
  }[];
};

function list(
  value: readonly string[] | undefined,
) {
  if (!value?.length) {
    return (
      <p className="m-0 text-sm text-muted-foreground leading-[22px]">
        None recorded.
      </p>
    );
  }

  return (
    <ul className="m-0 min-w-0 space-y-1 pl-5 text-sm text-body break-words">
      {value.map((item, index) => (
        <li key={index} className="break-words">{item}</li>
      ))}
    </ul>
  );
}

export function ProjectTemplateView({
  blueprint,
}: {
  blueprint: unknown;
}) {
  const data =
    blueprint &&
    typeof blueprint === "object"
      ? (blueprint as ProjectTemplateBlueprintView)
      : {};

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <section className="min-w-0 border-b border-border pb-4">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          Overview
        </h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
          {data.overview?.goal?.trim() ||
            "No project goal recorded."}
        </p>
        {data.overview?.description?<p className="mt-2 whitespace-pre-wrap text-sm text-body">
          {data.overview.description}</p>:null}
        <dl className="mt-3 grid gap-3 text-xs text-body sm:grid-cols-2">
          <div><dt className="font-semibold">Course</dt>
            <dd>{data.overview?.courseLabel??data.legacy?.courseLabel??"Not recorded"}</dd></div>
          <div><dt className="font-semibold">Phase</dt>
            <dd>{data.overview?.phase??data.legacy?.phase??"Not recorded"}</dd></div>
        </dl>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--lms-heading)]">
              Deliverables
            </h3>
            {list(data.overview?.deliverables)}
            {(!data.overview?.deliverables?.some(value=>value.trim()))?
              <p role="alert" className="mt-2 text-sm font-semibold text-warning-text">Add at least one deliverable.</p>:null}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--lms-heading)]">
              Definition of done
            </h3>
            {list(data.overview?.definitionOfDone)}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--lms-heading)]">Personas</h3>
            {list(data.overview?.personas)}
          </div>
        </div>
      </section>

      {data.legacy ? <section aria-label="Imported template metadata" className="border-b border-border pb-4">
        <h2 className="font-semibold">Source template metadata</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt>Course</dt><dd>{data.legacy.courseLabel||"Not recorded"}</dd></div>
          <div><dt>Phase</dt><dd>{data.legacy.phase||"Not recorded"}</dd></div>
          <div><dt>Status</dt><dd>{data.legacy.status||"Not recorded"}</dd></div>
          <div><dt>Lifecycle</dt><dd>{data.legacy.lifecycleStatus||"Not recorded"}</dd></div>
        </dl>
      </section> : null}
      {data.submission||data.overview?.submissionType||data.overview?.submissionInstructions?
        <section className="border-b border-border pb-4" aria-label="Template submission settings">
          <h2 className="font-semibold">Submission settings</h2>
          <p className="mt-2 text-xs font-semibold text-body">
            Type: {data.overview?.submissionType??"Not recorded"}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {data.overview?.submissionInstructions??data.submission?.instructions??
              "No instructions recorded."}</p>
          {data.submission?.requiredEvidence?list(data.submission.requiredEvidence):null}
        </section>:null}
      <section className="grid min-w-0 grid-cols-1 gap-4">
        <TemplateRows
          title="Releases"
          rows={data.releases}
        />
        <TemplateRows
          title="Sprints"
          rows={data.sprints}
        />
        <TemplateRows
          title="Tasks"
          rows={data.tasks}
        />
        <TemplateRows
          title="Resources"
          rows={data.resources}
        />
      </section>
    </div>
  );
}

function TemplateRows({
  title,
  rows,
}: {
  title: string;
  rows:
    | readonly {
        key?: string;
        title?: string;
        description?: string;
        priority?: string;
        required?: boolean;
      }[]
    | undefined;
}) {
  return (
    <section className="border-b border-border pb-[16px]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">
          {title}
        </h2>
        <Badge tone="neutral">
          {rows?.length ?? 0}
        </Badge>
      </div>
      {!rows?.length ? (
        <p className="mb-0 mt-3 text-sm text-muted-foreground leading-[22px]">
          None configured.
        </p>
      ) : (
        <div className="mt-3 min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
          {rows.map((row, index) => (
            <article
              key={row.key ?? index}
              className="min-w-0 py-[var(--lms-space-3)]"
            >
              <p className="m-0 break-words text-sm font-semibold text-foreground leading-[22px]">
                {row.title?.trim() ||
                  row.key?.trim() ||
                  "Untitled"}
              </p>
              {row.description ? (
                <p className="mt-1 break-words text-xs text-body leading-[20px]">
                  {row.description}
                </p>
              ) : null}
              {row.priority ? (
                <p className="mb-0 mt-2 break-words text-xs text-muted-foreground leading-[20px]">
                  Priority: {row.priority}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
