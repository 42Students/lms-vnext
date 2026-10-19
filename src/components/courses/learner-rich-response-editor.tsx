"use client";
import {useRef} from "react";
import {Button} from "@/components/ui/button";

/** User text stays text: no untrusted HTML is ever interpreted or injected. */
export function LearnerRichResponseEditor({value,onChange,disabled=false}:{
 value:string;onChange:(next:string)=>void;disabled?:boolean;
}){
 const input=useRef<HTMLTextAreaElement|null>(null);
 function wrap(before:string,after=before){
  const target=input.current;
  if(!target||disabled)return;
  const a=target.selectionStart,b=target.selectionEnd;
  const selection=value.slice(a,b)||"text";
  const next=value.slice(0,a)+before+selection+after+value.slice(b);
  if(next.length>50000)return;
  onChange(next);
  requestAnimationFrame(()=>{target.focus();target.setSelectionRange(a+before.length,a+before.length+selection.length);});
 }
 return <div className="space-y-2" aria-label="Written response rich-text editor">
  <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap gap-2">
   <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={()=>wrap("**")} aria-label="Bold selected text">Bold</Button>
   <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={()=>wrap("_")} aria-label="Italic selected text">Italic</Button>
   <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={()=>wrap("- ","")} aria-label="Make selected text a list item">List item</Button>
  </div>
  <textarea ref={input} name="writtenResponse" rows={6} maxLength={50000}
   disabled={disabled} required value={value} onChange={event=>onChange(event.target.value)}
   placeholder="Write your assignment response…" aria-label="Written response"
   className="min-h-32 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] disabled:bg-surface-subtle"/>
  <p className="text-xs text-muted-foreground">Formatting is kept with your answer: bold, italic and list items. Review your response before final submission.</p>
 </div>;
}
