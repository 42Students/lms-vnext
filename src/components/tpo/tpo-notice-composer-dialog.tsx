"use client";
import {useId,useRef,type ReactNode} from "react";
/** TPO-inbox-team-50: native modal preserves keyboard Escape and focus return. */
export function TpoNoticeComposerDialog({children,mode="NEW"}:{children:ReactNode;mode?:"NEW"|"EDIT"}){
 const dialog=useRef<HTMLDialogElement>(null);
 const titleId=useId();
 return <>
  <button type="button" onClick={()=>dialog.current?.showModal()}
   className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
   {mode==="EDIT"?"Edit announcement":"New announcement"}
  </button>
  <dialog ref={dialog} aria-labelledby={titleId}
   className="m-auto max-h-[90dvh] w-[min(46rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/60">
   <div className="flex items-center justify-between gap-3 border-b border-border p-4">
    <h2 id={titleId} className="text-lg font-semibold">{mode==="EDIT"?"Edit announcement":"New announcement"}</h2>
    <button type="button" onClick={()=>dialog.current?.close()}
     className="min-h-10 rounded-md border border-border px-3">Close</button>
   </div>
   <div className="p-4">{children}</div>
  </dialog>
 </>;
}
