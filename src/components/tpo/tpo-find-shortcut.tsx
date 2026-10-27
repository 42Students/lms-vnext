"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState,type KeyboardEvent} from "react";
import {Dialog} from "@/components/ui/dialog";
import { PopoverListbox } from "@/components/ui/popover";
import {apiFetch} from "@/lib/api-fetch";
import {isTpoFindShortcut} from "@/modules/placements/tpo-find-shortcut-model";
import {safeTpoFindResult, type TpoFindResult} from "@/components/shell/topbar/tpo-find-model";
import {Input} from "@/components/ui/input";

type Match=TpoFindResult;

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
     setResults(data.results.filter(safeTpoFindResult).slice(0,25));setActive(0);setError("");
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
  if(!safeTpoFindResult(row))return;
  setRecent(list=>[row,...list.filter(item=>item.href!==row.href)].slice(0,5));
  setOpen(false);router.push(row.href);
 }
 function handleKeyDown(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==="ArrowDown"){event.preventDefault();setActive(current=>showing.length?(current+1)%showing.length:0);}
  if(event.key==="ArrowUp"){event.preventDefault();setActive(current=>showing.length?(current-1+showing.length)%showing.length:0);}
  if(event.key==="Enter"&&showing[active]){event.preventDefault();select(showing[active]);}
  if(event.key==="Escape"){event.preventDefault();event.stopPropagation();setOpen(false);}
 }
 return <>
  <Button variant="ghost" type="button" onClick={()=>setOpen(true)}
   className="min-h-11 w-full flex-wrap justify-between gap-2 text-left sm:w-auto md:min-h-9">
   Find a student, recruiter or company
   <kbd className="rounded border border-border px-1.5 py-0.5 text-xs no-underline">Ctrl K</kbd>
  </Button>
  <Dialog open={open} onOpenChange={value=>{setOpen(value);if(value)requestAnimationFrame(()=>inputRef.current?.focus());}}
    title="Find a student, recruiter or company" description="Search records in your college. Use arrow keys to navigate, Enter to open and Esc to close.">
   <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search records
    <Input ref={inputRef} autoFocus value={query} onKeyDown={handleKeyDown}
      role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open}
      aria-controls="tpo-find-results" aria-activedescendant={active>=0&&active<showing.length?"tpo-find-result-"+active:undefined}
      onChange={event=>changeQuery(event.target.value)} placeholder="Type at least 2 characters"
      maxLength={100} className="mt-2 min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>
   <PopoverListbox id="tpo-find-results" label="Matching records" aria-busy={loading} className="mt-3 !min-h-0 max-h-72 space-y-0 overflow-y-auto !border-0 !p-0 !shadow-none" onDismiss={() => setOpen(false)}>
    {query.trim().length<2?<div role="presentation" className="px-3 pb-2 pt-2 text-xs font-semibold text-muted-foreground">Recently opened</div>:null}
    {showing.map((row,index)=><Button variant="ghost" type="button" key={row.href}
      id={"tpo-find-result-"+index} role="option" aria-selected={active===index}
      onMouseEnter={()=>setActive(index)} onClick={()=>select(row)}
      className={"flex min-h-11 w-full min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 rounded-[var(--lms-control-radius)] px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 "+
       (active===index?"bg-primary-subtle":"hover:bg-muted")}>
      <span className="min-w-0 flex-1 break-words">{row.label}</span><span className="max-w-full shrink-0 break-words text-xs text-muted-foreground">{row.group}</span>
    </Button>)}
    {!showing.length&&!loading&&!error?<p role="status" className="p-3 text-sm text-muted-foreground leading-[22px]">
      {query.trim().length<2?"Open a record to see it here.":"No matching records."}</p>:null}
    {loading?<p role="status" className="p-3 text-sm text-muted-foreground leading-[22px]">Searching…</p>:null}
    {error?<div role="alert"><Alert tone="error">{error}</Alert></div>:null}
   </PopoverListbox>
   <div className="mt-3 flex min-w-0 flex-col items-stretch gap-2 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
    <span className="min-w-0 break-words">↑ ↓ Navigate · Enter Open · Esc Close</span>
    <Link href={"/tpo/find"+(query.trim()?"?q="+encodeURIComponent(query.trim()):"")}
      className="lms-inline-link inline-flex min-h-11 w-full items-center justify-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9" onClick={()=>setOpen(false)}>Open full search</Link>
   </div>
  </Dialog>
 </>;
}
