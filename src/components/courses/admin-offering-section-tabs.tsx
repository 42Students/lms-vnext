"use client";

import {useEffect, useState} from "react";
import {usePathname} from "next/navigation";
import {Tabs} from "@/components/ui/tabs";

const sections = [
  {value:"course-home",label:"Home"},
  {value:"course-syllabus",label:"Syllabus"},
  {value:"who-teaches-it",label:"Who teaches it"},
  {value:"section-content",label:"Section content"},
] as const;

/** Preserve the existing anchor-scroll workflow while using legacy shared Tabs. */
export function AdminOfferingSectionTabs(){
  const pathname=usePathname()??"/";
  const [selected,setSelected]=useState<string>("course-home");
  useEffect(()=>{
    const sync=()=>{
      let hash="";
      try {hash=decodeURIComponent(window.location.hash.slice(1));}
      catch {hash="";}
      setSelected(sections.some(item=>item.value===hash)?hash:"course-home");
    };
    sync();
    window.addEventListener("hashchange",sync);
    return ()=>window.removeEventListener("hashchange",sync);
  },[]);
  return <Tabs ariaLabel="Course detail tabs" renderPanel={false}
    value={selected} items={sections.map(item=>({
      ...item,href:pathname+"#"+item.value,
    }))}/>;
}
