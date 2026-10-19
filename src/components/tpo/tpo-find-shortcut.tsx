"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState,type KeyboardEvent} from "react";
import {Dialog} from "@/components/ui/dialog";
import {apiFetch} from "@/lib/api-fetch";
import {isTpoFindShortcut} from "@/modules/placements/tpo-find-shortcut-model";

type Match={group:string;label:string;href:string};
const safeMatch=(value:unknown):value is Match=>
 Boolean(value&&typeof value==="object"&&"href" in value&&"label" in value&&"group" in value&&
 typeof value.href==="string"&&/^\/tpo\/(?!\/)[^\\]*$/.test(value.href)&&
 typeof value.label==="string"&&typeof value.group==="string");

export function TpoFindShortcut(){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<Match[]>([]);
 const [recent,setRecent]=useState<Match[]>([]);
 const [active,setActive]=useState(0);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);

 useEffect(()=>{
  const handler=(event:globalThis.KeyboardEvent)=>{
   if(!isTpoFindShortcut(event)||event.repeat)return;
   event.preventDefault();
   setOpen(true);
  };
  window.addEventListener("keydown",handler);
  return ()=>window.removeEventListener("keydown",handler);
 },[]);

 useEffect(()=>{
  if(!open||query.trim().length<2)return;
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>{
   void (async()=>{
    try{
     const data=await apiFetch<unknown>("/api/tpo/find-suggestions?q="+encodeURIComponent(query.trim()),{
      signal:controller.signal,cache:"no-store",timeoutMs:12000,
     });
     if(controller.signal.aborted)return;
     if(!data||typeof data!=="object"||!("results" in data)||!Array.isArray(data.results))
      throw new Error("Search could not be loaded.");
     setResults(data.results.filter(safeMatch).slice(0,25));setActive(0);setError("");
    }catch{
     if(!controller.signal.aborted)setError("Search could not be loaded. Try again.");
    }finally{
     if(!controller.signal.aborted)setLoading(false);
    }
   })();
  },200);
  return ()=>{window.clearTimeout(timeout);controller.abort();};
 },[open,query]);

 function changeQuery(value:string){
  setQuery(value);setResults([]);setActive(0);setError("");setLoading(value.trim().length>=2);
 }
 const showing=query.trim().length>=2?results:recent;
 function select(row:Match){
  if(!safeMatch(row))return;
  setRecent(list=>[row,...list.filter(item=>item.href!==row.href)].slice(0,5));
  setOpen(false);router.push(row.href);
 }
 function handleKeyDown(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==="ArrowDown"){event.preventDefault();setActive(current=>showing.length?(current+1)%showing.length:0);}
  if(event.key==="ArrowUp"){event.preventDefault();setActive(current=>showing.length?(current-1+showing.length)%showing.length:0);}
  if(event.key==="Enter"&&showing[active]){event.preventDefault();select(showing[active]);}
  if(event.key==="Escape"){event.preventDefault();setOpen(false);}
 }
 return <>
  <Button variant="ghost" type="button" onClick={()=>setOpen(true)}
   className="min-h-9 gap-2">
   Find a student, recruiter or company
   <kbd className="rounded border border-border px-1.5 py-0.5 text-xs no-underline">Ctrl K</kbd>
  </Button>
  <Dialog open={open} onOpenChange={value=>{setOpen(value);if(value)requestAnimationFrame(()=>inputRef.current?.focus());}}
    title="Find a student, recruiter or company" description="Search records in your college. Use arrow keys to navigate, Enter to open and Esc to close.">
   <label className="block text-sm font-semibold">Search records
    <input ref={inputRef} autoFocus value={query} onKeyDown={handleKeyDown}
      aria-controls="tpo-find-results" aria-activedescendant={showing.length?"tpo-find-result-"+active:undefined}
      onChange={event=>changeQuery(event.target.value)} placeholder="Type at least 2 characters"
      maxLength={100} className="mt-2 min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"/>
   </label>
   <div id="tpo-find-results" role="listbox" aria-label="Matching records" className="mt-4 max-h-80 space-y-1 overflow-y-auto">
    {query.trim().length<2?<h3 className="text-xs font-semibold text-muted-foreground">Recently opened</h3>:null}
    {showing.map((row,index)=><button type="button" key={row.href}
      id={"tpo-find-result-"+index} role="option" aria-selected={active===index}
      onMouseEnter={()=>setActive(index)} onClick={()=>select(row)}
      className={"flex min-h-11 w-full items-center justify-between rounded-[var(--lms-control-radius)] px-3 py-2 text-left text-sm "+
       (active===index?"bg-primary-subtle":"hover:bg-muted")}>
      <span className="truncate">{row.label}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{row.group}</span>
    </button>)}
    {!showing.length&&!loading?<p role="status" className="p-3 text-sm text-muted-foreground">
      {query.trim().length<2?"Open a record to see it here.":"No matching records."}</p>:null}
    {loading?<p role="status" className="p-3 text-sm text-muted-foreground">Searching…</p>:null}
    {error?<p role="alert" className="p-3 text-sm text-error">{error}</p>:null}
   </div>
   <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
    <span>↑ ↓ Navigate · Enter Open · Esc Close</span>
    <Link href={"/tpo/find"+(query.trim()?"?q="+encodeURIComponent(query.trim()):"")}
      className="font-semibold text-primary-text underline" onClick={()=>setOpen(false)}>Open full search</Link>
   </div>
  </Dialog>
 </>;
}
