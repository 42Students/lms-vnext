"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
/** REC-calendar-messages-profile-13: refresh only while the thread/inbox
 * is in view. The server remains authoritative and GET never mutates state. */
export function RecruiterConversationLiveRefresh(){
 const router=useRouter();
 useEffect(()=>{
  const update=()=>{
   if(document.visibilityState!=="visible")return;
   const current=document.activeElement;
   if(current instanceof HTMLElement&&current.closest("textarea,[contenteditable=true]"))return;
   router.refresh();
  };
  const id=window.setInterval(update,4000);
  window.addEventListener("focus",update);
  return ()=>{window.clearInterval(id);window.removeEventListener("focus",update);};
 },[router]);
 return null;
}
