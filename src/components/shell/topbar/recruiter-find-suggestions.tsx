"use client";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";
import {SearchIcon} from "./icons";
import style from "./topbar.module.css";

type Choice={id:string;name:string};
type SearchResult={key:string;kind:"Drive";title:string;context:string;href:string};
type Payload={results:SearchResult[];chooseCollege:boolean;choices:Choice[]};
function validResult(value:unknown):value is SearchResult{
 if(!value||typeof value!=="object")return false;
 const x=value as Partial<SearchResult>;
 return typeof x.key==="string"&&typeof x.title==="string"&&
  typeof x.context==="string"&&x.kind==="Drive"&&typeof x.href==="string"&&
  /^\/recruiter\/drives\/[0-9a-f-]{36}$/.test(x.href);
}
function validChoice(value:unknown):value is Choice{
 if(!value||typeof value!=="object")return false;
 const x=value as Partial<Choice>;
 return typeof x.id==="string"&&/^[0-9a-f-]{36}$/i.test(x.id)&&
  typeof x.name==="string";
}

/** No cross-college search at the topbar: choose an active, server-supplied
 * membership and only then show real scoped, linked drive suggestions. */
export function RecruiterFindSuggestions({
 query,onOpen,
}:{query:string;onOpen:(href:string)=>void}){
 const term=query.trim().slice(0,100);
 const [collegeId,setCollegeId]=useState<string|null>(null);
 const [retry,setRetry]=useState(0);
 const [state,setState]=useState<{key:string;payload:Payload|null;error:boolean}>({
  key:"",payload:null,error:false,
 });
 const requestKey=term+"|"+(collegeId??"");
 useEffect(()=>{
  if(term.length<2)return;
  const controller=new AbortController();
  const timer=window.setTimeout(()=>{
   void apiFetch<unknown>("/api/placements/recruiter/quick-search?q="+encodeURIComponent(term)+
    (collegeId?"&collegeId="+encodeURIComponent(collegeId):""),{
     signal:controller.signal,cache:"no-store",timeoutMs:12000,
    }).then(value=>{
     if(controller.signal.aborted)return;
     if(!value||typeof value!=="object"||!("results" in value)||
       !Array.isArray(value.results)||!("choices" in value)||
       !Array.isArray(value.choices))throw new Error("Invalid search");
     const v=value as {results:unknown[];choices:unknown[];chooseCollege?:unknown};
     setState({key:requestKey,error:false,payload:{
      results:v.results.filter(validResult).slice(0,8),
      choices:v.choices.filter(validChoice).slice(0,50),
      chooseCollege:v.chooseCollege===true,
     }});
    }).catch(()=>{if(!controller.signal.aborted)setState({
     key:requestKey,error:true,payload:null,
    });});
  },180);
  return()=>{controller.abort();window.clearTimeout(timer);};
 },[term,collegeId,retry,requestKey]);
 if(term.length<2)return null;
 const ready=state.key===requestKey;
 return <section aria-label="Matching recruiter drives" className="min-w-0 border-t border-border">
   <p className="px-2 pt-2 text-xs font-semibold uppercase text-muted-foreground">Your hiring drives</p>
   {!ready?<p role="status" className="p-2 text-xs text-muted-foreground">Searching your authorized college…</p>:null}
   {ready&&state.error?<div className="flex flex-wrap items-center gap-2 p-2">
    <p role="alert" className="text-xs text-error">Drive search unavailable.</p>
    <Button variant="ghost" type="button" size="sm" onClick={()=>setRetry(v=>v+1)}>Retry</Button>
   </div>:null}
   {ready&&state.payload?.chooseCollege?<div className="space-y-2 p-2">
     <p className="text-xs text-muted-foreground">Choose a college before searching; results are never combined across colleges.</p>
     <div className="flex flex-wrap gap-2">{state.payload.choices.map(item=><Button
       type="button" variant="secondary" size="sm" key={item.id}
       onClick={()=>setCollegeId(item.id)}>{item.name}</Button>)}</div>
     {!state.payload.choices.length?<p role="status" className="text-xs">No active college access is available.</p>:null}
    </div>:null}
   {ready&&state.payload&&!state.payload.chooseCollege&&state.payload.results.length===0?
     <p role="status" className="p-2 text-xs text-muted-foreground">No matching drives in this college.</p>:null}
   {ready&&state.payload?.results.map(item=><Button
     type="button" variant="ghost" role="option" aria-selected={false}
     className={style["suggestion"]+" min-w-0 max-w-full"}
     key={item.key} onClick={()=>onOpen(item.href)}>
     <SearchIcon/>
     <span className="min-w-0 flex-1 truncate">{item.title}</span>
     <span className="max-w-[45%] shrink-0 truncate text-xs text-muted-foreground">{item.context}</span>
    </Button>)}
  </section>;
}
