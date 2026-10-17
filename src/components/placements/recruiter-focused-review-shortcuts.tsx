"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

/** Navigation shortcuts only. Applicant outcomes remain server-authorized and
 * cannot be changed by a key pressed in the browser. */
export function RecruiterFocusedReviewShortcuts({closeHref,previousHref,nextHref}:{
 closeHref:string;previousHref:string|null;nextHref:string|null;
}){
 const router=useRouter();
 useEffect(()=>{
  const modal=document.getElementById("recruiter-focused-review-dialog");
  if(!modal)return;
  const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const title=modal.querySelector<HTMLElement>("#hr-applicant-drawer-title");
  const frame=window.requestAnimationFrame(()=>{title?.setAttribute("tabindex","-1");title?.focus();});
  const onKey=(e:KeyboardEvent)=>{
   if(e.defaultPrevented||!modal.contains(document.activeElement))return;
   const element=e.target as HTMLElement;
   if(e.key==="Escape"){e.preventDefault();router.push(closeHref);return;}
   if(e.key==="Tab"){
     const focusable=[...modal.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')]
       .filter(item=>item.getClientRects().length>0);
     if(!focusable.length){e.preventDefault();title?.focus();return;}
     const first=focusable[0]!,last=focusable[focusable.length-1]!;
     if(e.shiftKey&&(document.activeElement===first||document.activeElement===title)){
       e.preventDefault();last.focus();
     }else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
     return;
   }
   if(element.closest("input,textarea,select,[contenteditable=true]"))return;
   if(e.key.toLowerCase()==="n"&&nextHref){e.preventDefault();router.push(nextHref);}
   else if(e.key.toLowerCase()==="p"&&previousHref){e.preventDefault();router.push(previousHref);}
  };
  document.addEventListener("keydown",onKey);
  return ()=>{window.cancelAnimationFrame(frame);document.removeEventListener("keydown",onKey);
    if(opener?.isConnected)opener.focus();};
 },[router,closeHref,nextHref,previousHref]);
 return <p className="mt-3 text-xs text-muted-foreground">Keyboard: N next, P previous, Esc close. Official decisions are made in Rounds.</p>;
}
