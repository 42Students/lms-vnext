"use client";
import {useEffect} from "react";
/** TPO-inbox-team-41: jump to the newest visible message or a deep-linked one. */
export function TpoTeamMessageScroll({highlightId}:{highlightId?:string}){
 useEffect(()=>{
  const target=highlightId
   ?document.getElementById("team-message-"+highlightId)
   :document.querySelector('[aria-label="Private team messages"] li:last-child');
  if(!target)return;
  const frame=window.requestAnimationFrame(()=>target.scrollIntoView({
   block:"nearest",behavior:"auto",
  }));
  return ()=>window.cancelAnimationFrame(frame);
 },[highlightId]);
 return null;
}
