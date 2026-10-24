"use client";

import {useState} from "react";
import {mentorEvidenceDisplayKind} from
  "@/modules/projects/mentor-evidence-preview-model";

export type MentorEvidenceGalleryItem={
  index:number;name:string;type:string;href:string|null;
};

export function MentorEvidenceGallery({items}:{items:readonly MentorEvidenceGalleryItem[]}){
  const [selected,setSelected]=useState(items[0]?.index??-1);
  const active=items.find(item=>item.index===selected)??items[0];
  const kind=active?mentorEvidenceDisplayKind(active.href,active.type):"EXTERNAL";
  return <div className="prototype-mentor-delivery-artifacts">
    <h3>What they sent · {items.length} files and links</h3>
    <div role="group" aria-label="Choose evidence to preview">
      {items.map(item=><button key={item.index} type="button"
        aria-pressed={active?.index===item.index}
        onClick={()=>setSelected(item.index)}
        className="flex min-h-11 w-full items-start justify-between gap-2 border-b border-border px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span><strong>{item.name}</strong>
          <small className="block">{item.type}</small></span>
        <span>{active?.index===item.index?"Selected":"Preview →"}</span>
      </button>)}
    </div>
    {active?<section aria-live="polite" aria-label="Selected submission evidence"
      className="space-y-2 border border-border p-3">
      <h4 className="font-semibold">{active.name}</h4>
      <p className="text-xs text-muted-foreground">{active.type}</p>
      {active.href&&kind==="VIDEO"?<video key={active.href}
        src={active.href} controls preload="metadata"
        className="max-h-[28rem] w-full" />:
       active.href&&(kind==="IMAGE"||kind==="DOCUMENT")?<iframe
         key={active.href} src={active.href} title={"Preview of "+active.name}
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
