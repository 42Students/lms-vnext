"use client";

import {useEffect,useState,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {Tabs} from "@/components/ui/tabs";

const sections=[
 {value:"course-home",label:"Home"},
 {value:"course-syllabus",label:"Syllabus"},
] as const;

/** A single active panel matches the original Course Home / Syllabus tab
 * strip. Faculty and Section preview remain available within Syllabus,
 * rather than adding new global tabs or anchor-scrolling multiple panes. */
export function AdminOfferingSectionTabs({home,syllabus}:{
 home:ReactNode;syllabus:ReactNode;
}){
 const pathname=usePathname()??"/";
 const [selected,setSelected]=useState<string>("course-home");
 useEffect(()=>{
  const sync=()=>{
   let hash="";
   try{hash=decodeURIComponent(window.location.hash.slice(1));}
   catch{hash="";}
   setSelected(sections.some(item=>item.value===hash)?hash:"course-home");
  };
  sync();window.addEventListener("hashchange",sync);
  return()=>window.removeEventListener("hashchange",sync);
 },[]);
 return <div className="min-w-0 space-y-4">
  <Tabs ariaLabel="Course detail tabs" renderPanel={false}
   value={selected} items={sections.map(item=>({...item,href:pathname+"#"+item.value}))}/>
  {selected==="course-home"?
   <section id="course-home" aria-label="Course Home" role="tabpanel"
    className="min-w-0 space-y-3" tabIndex={0}>{home}</section>:
   <section id="course-syllabus" aria-label="Course Syllabus" role="tabpanel"
    className="min-w-0 space-y-3" tabIndex={0}>{syllabus}</section>}
 </div>;
}
