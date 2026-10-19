"use client";

import {Button} from "@/components/ui/button";
import {LearnerRichResponseEditor} from "./learner-rich-response-editor";
export type AssignmentLinkPart={kind:"REPOSITORY_LINK"|"EXTERNAL_LINK";url:string;caption:string};

export function AssignmentMultipartPartsEditor({text,onTextChange,links,onLinksChange,disabled}:{
 text:string;onTextChange:(next:string)=>void;links:AssignmentLinkPart[];
 onLinksChange:(next:AssignmentLinkPart[])=>void;disabled:boolean;
}){
 return <section aria-label="Additional submission parts" className="space-y-3 rounded-xl border border-border bg-surface-subtle p-3">
  <h4 className="text-sm font-semibold">Written response and links (optional)</h4>
  <LearnerRichResponseEditor value={text} onChange={onTextChange} disabled={disabled}/>
  {links.map((link,index)=><div key={index} className="grid gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
   <label className="grid gap-1 text-sm">Link type
    <select value={link.kind} disabled={disabled}
     className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"
     onChange={e=>onLinksChange(links.map((item,i)=>i===index?{...item,kind:e.target.value as AssignmentLinkPart["kind"]}:item))}>
     <option value="REPOSITORY_LINK">Repository Link</option>
     <option value="EXTERNAL_LINK">Website / External Link</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm">HTTPS link
    <input type="url" maxLength={2048} value={link.url} disabled={disabled}
     className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"
     onChange={e=>onLinksChange(links.map((item,i)=>i===index?{...item,url:e.target.value}:item))}/>
   </label>
   <label className="grid gap-1 text-sm">Caption
    <input maxLength={255} value={link.caption} disabled={disabled}
     className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"
     onChange={e=>onLinksChange(links.map((item,i)=>i===index?{...item,caption:e.target.value}:item))}/>
   </label>
   <Button type="button" size="sm" variant="secondary" disabled={disabled}
    onClick={()=>onLinksChange(links.filter((_,i)=>i!==index))}>Remove link</Button>
  </div>)}
  <Button type="button" size="sm" variant="secondary" disabled={disabled||links.length>=20}
   onClick={()=>onLinksChange([...links,{kind:"EXTERNAL_LINK",url:"",caption:""}])}>
   Add another link
  </Button>
 </section>;
}
