"use client";
import {useRef} from "react";
import {useRouter} from "next/navigation";
import {Input} from "@/components/ui/input";

/** Legacy 350ms type-to-filter; search retains lifecycle filters and scroll. */
export function SuperAdminTemplateAutoSearch({defaultValue}:{defaultValue:string}){
 const router=useRouter();
 const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 return <Input type="search" name="q" aria-label="Search title or slug"
  placeholder="Search title or slug" maxLength={100} defaultValue={defaultValue}
  className="min-h-11 w-full min-w-0 md:min-h-9"
  onChange={event=>{
   const value=event.currentTarget.value.trim();
   if(timeout.current!==null)clearTimeout(timeout.current);
   timeout.current=setTimeout(()=>{
    const params=new URLSearchParams(window.location.search);
    if(value)params.set("q",value);else params.delete("q");
    params.delete("page");
    const query=params.toString();
    router.replace("/admin/projects/templates"+(query?"?"+query:""),{scroll:false});
   },350);
  }}/>;
}
