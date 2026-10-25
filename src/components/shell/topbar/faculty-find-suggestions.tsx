"use client";
import {useEffect,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {SearchIcon} from "./icons";
import {Button} from "@/components/ui/button";
import type {FacultyFindGroup} from "@/modules/courses/faculty-find-model";
import style from "./topbar.module.css";

type Result={key:string;group:FacultyFindGroup;label:string;context:string;href:string};
const permitted=(raw:unknown):raw is Result=>
 raw!==null&&typeof raw==="object"&&
 "key" in raw&&typeof raw.key==="string"&&
 "label" in raw&&typeof raw.label==="string"&&
 "context" in raw&&typeof raw.context==="string"&&
 "group" in raw&&["Students","Colleagues","Courses","Assignments","Quizzes","Pages"].includes(String(raw.group))&&
 "href" in raw&&typeof raw.href==="string"&&
 /^\/teacher(?:$|\/(?:courses(?:\/|$)|contacts\/teachers\/|report\/assignment\/|report\/quiz\/|calendar$|assessments$))/.test(raw.href)&&
 !raw.href.startsWith("//");

const groups:{label:string;items:readonly FacultyFindGroup[]}[]=[
 {label:"Students in your classes",items:["Students"]},
 {label:"Colleagues",items:["Colleagues"]},
 {label:"Courses and pages",items:["Courses","Pages","Assignments","Quizzes"]},
];

export function FacultyFindSuggestions({query,onOpen}:{
 query:string;onOpen:(href:string)=>void;
}){
 const needle=query.trim().slice(0,100);
 const [retry,setRetry]=useState(0);
 const [state,setState]=useState<{term:string;results:Result[];error:boolean;}>({
  term:"",results:[],error:false,
 });
 useEffect(()=>{
  if(needle.length<2)return;
  const controller=new AbortController();
  const timer=window.setTimeout(()=>{
   void apiFetch<unknown>("/api/courses/faculty/find?q="+encodeURIComponent(needle),{
    signal:controller.signal,cache:"no-store",timeoutMs:12000,
   }).then(payload=>{
    if(controller.signal.aborted)return;
    const rows=payload&&typeof payload==="object"&&"results" in payload&&
      Array.isArray(payload.results)?payload.results:null;
    if(!rows)throw new Error("Invalid find results");
    setState({term:needle,results:rows.filter(permitted).slice(0,21),error:false});
   }).catch(()=>{if(!controller.signal.aborted)setState({term:needle,results:[],error:true});});
  },220);
  return ()=>{controller.abort();window.clearTimeout(timer);};
 },[needle,retry]);
 if(needle.length<2)return null;
 const ready=state.term===needle;
 return <section aria-label="Matching Faculty records" className="border-t border-[#e5ebf2]">
  {!ready?<p role="status" className="px-3 py-3 text-xs text-[#60718b]">Finding students, colleagues and courses…</p>:null}
  {ready&&state.error?<div className="flex items-center gap-3 px-3 py-3">
   <p role="alert" className="flex-1 text-xs text-red-700">Find could not load your teaching records.</p>
   <Button size="sm" variant="link" type="button" onClick={()=>setRetry(x=>x+1)}>Retry</Button>
  </div>:null}
  {groups.map(group=>{
   const entries=ready&&!state.error?state.results.filter(row=>group.items.includes(row.group)):[];
   return entries.length?<div key={group.label}>
    <p className="border-t border-[#edf1f5] px-3 pt-3 text-xs font-bold uppercase tracking-wide text-[#60718b]">{group.label}</p>
    {entries.map(item=><Button key={item.key} type="button" variant="ghost"
      role="option" aria-selected={false} className={style["suggestion"]+" !w-full !justify-start"}
      onClick={()=>onOpen(item.href)}>
      {item.group==="Students"||item.group==="Colleagues"?
       <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#def1f3] text-xs font-bold text-[#078191]">
        {(item.label.trim().split(/\s+/).map(part=>part[0]??"").slice(0,2).join("")||"U").toUpperCase()}</span>:
       <SearchIcon/>}
      <span className="min-w-0">
       <span className="block truncate text-left text-sm font-bold">{item.label}</span>
       <span className="block truncate text-left text-xs text-[#60718b]">{item.context}</span>
      </span>
    </Button>)}
   </div>:null;
  })}
  {ready&&!state.error&&state.results.length===0?
   <p role="status" className="px-3 py-3 text-xs text-[#60718b]">
    No matches in your assigned classes or college contacts.</p>:null}
  {ready&&!state.error?<p className="border-t border-[#edf1f5] px-3 py-2 text-xs text-[#60718b]">
   Only students in classes you teach are included. Colleagues are active Faculty at your college.</p>:null}
 </section>;
}
