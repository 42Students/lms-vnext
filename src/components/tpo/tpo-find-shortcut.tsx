"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {isTpoFindShortcut} from "@/modules/placements/tpo-find-shortcut-model";
export function TpoFindShortcut(){
 const router=useRouter();
 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{
   if(!isTpoFindShortcut(event)||event.repeat)return;
   event.preventDefault();
   router.push("/tpo/find");
  };
  window.addEventListener("keydown",handler);
  return ()=>window.removeEventListener("keydown",handler);
 },[router]);
 return <Link href="/tpo/find"
  className="inline-flex min-h-11 items-center gap-2 text-sm text-primary-text underline">
  Find a student, recruiter or company
  <kbd className="rounded border border-border px-1.5 py-0.5 text-xs no-underline">Ctrl K</kbd>
 </Link>;
}
