"use client";

import {useState} from "react";
import {mentorEvidenceDisplayKind} from
  "@/modules/projects/mentor-evidence-preview-model";
import {mentorPdfEmbedUrl} from "@/modules/projects/mentor-pdf-evidence-controls-model";

export type MentorEvidenceGalleryItem={
  index:number;name:string;type:string;href:string|null;
  change?:"NEW"|"LINK_CHANGED"|"UNCHANGED"|"ORIGINAL";
};

export function MentorEvidenceGallery({items}:{items:readonly MentorEvidenceGalleryItem[]}){
  const [selected,setSelected]=useState(items[0]?.index??-1);
  const [pdfPage,setPdfPage]=useState(1);
  const [pdfZoom,setPdfZoom]=useState(100);
  const active=items.find(item=>item.index===selected)??items[0];
  const kind=active?mentorEvidenceDisplayKind(active.href,active.type):"EXTERNAL";
  const pdfSrc=active?.href&&kind==="DOCUMENT"?
    mentorPdfEmbedUrl(active.href,pdfPage,pdfZoom):null;
  return <div className="prototype-mentor-delivery-artifacts">
    <h3>What they sent · {items.length} files and links</h3>
    <div role="group" aria-label="Choose evidence to preview">
      {items.map(item=><button key={item.index} type="button"
        aria-pressed={active?.index===item.index}
        onClick={()=>{setSelected(item.index);setPdfPage(1);setPdfZoom(100);}}
        className="flex min-h-11 w-full items-start justify-between gap-2 border-b border-border px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span><strong>{item.name}</strong>
          <small className="block">{item.type}</small>
          {item.change&&item.change!=="ORIGINAL"?<small className="block">
            {item.change==="NEW"?"New reference":
              item.change==="LINK_CHANGED"?"Reference changed":"Same saved reference"}
          </small>:null}</span>
        <span>{active?.index===item.index?"Selected":"Preview →"}</span>
      </button>)}
    </div>
    {active?<section aria-live="polite" aria-label="Selected submission evidence"
      className="space-y-2 border border-border p-3">
      <h4 className="font-semibold">{active.name}</h4>
      <p className="text-xs text-muted-foreground">{active.type}</p>
      {active.change&&active.change!=="ORIGINAL"?<p className="text-xs text-muted-foreground">
        {active.change==="NEW"?"This reference was not found under a unique name in the previous attempt.":
          active.change==="LINK_CHANGED"?"The recorded link or type changed from the previous attempt.":
          "The saved link and type match the previous attempt."}
        {" "}File contents have not been compared.
      </p>:null}
      {pdfSrc?<div role="group" aria-label="PDF page and zoom"
        className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pdfPage<=1}
          className="rounded border border-border px-3 py-2"
          onClick={()=>setPdfPage(old=>Math.max(1,old-1))}>
          Previous page
        </button>
        <label>Page
          <input type="number" min={1} max={999} value={pdfPage}
            className="ml-2 w-20 rounded border border-border p-2"
            onChange={event=>{
              const value=Number(event.target.value);
              if(Number.isSafeInteger(value))
                setPdfPage(Math.min(999,Math.max(1,value)));
            }}/>
        </label>
        <button type="button" disabled={pdfPage>=999}
          className="rounded border border-border px-3 py-2"
          onClick={()=>setPdfPage(old=>Math.min(999,old+1))}>
          Next page
        </button>
        <label>Zoom
          <select value={pdfZoom} className="ml-2 rounded border border-border p-2"
            onChange={event=>setPdfZoom(Number(event.target.value))}>
            {[50,75,100,125,150,200].map(value=>
              <option key={value} value={value}>{value}%</option>)}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">
          Page and zoom controls depend on your browser's PDF viewer.
        </p>
      </div>:null}
      {active.href&&kind==="VIDEO"?<video key={active.href}
        src={active.href} controls preload="metadata"
        className="max-h-[28rem] w-full" />:
       active.href&&(kind==="IMAGE"||kind==="DOCUMENT")?<iframe
         key={pdfSrc??active.href} src={pdfSrc??active.href}
         title={"Preview of "+active.name}
         sandbox="" loading="lazy" referrerPolicy="no-referrer"
         className="h-[26rem] w-full border border-border" />:
       <p>Inline preview is not available for this evidence type.
         Use the original link to open it with its provider.</p>}
      {active.href?<a href={active.href} target="_blank"
        rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-link underline">
        Open evidence in a new tab ↗
      </a>:<p>The saved record has no accessible evidence link.</p>}
      <p className="text-xs text-muted-foreground">Preview availability depends on
        the original provider's access rules; permission to this workspace
        does not grant access to an external file.</p>
    </section>:null}
  </div>;
}
