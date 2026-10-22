"use client";
import {useEffect,useRef,useState} from "react";
import {Input} from "@/components/ui/input";

type Result={membershipId:string;name:string};
type Kind="LEARNER"|"FACULTY";
const escapeQuery=(value:string)=>value.trim().slice(0,80);
/** 200ms debounced, tenant-scoped server suggestions. Cached recent and
 * popular queries belong to this college/role in sessionStorage only. */
export function CollegeRoleDirectoryAutocomplete({
  kind,collegeId,defaultValue="",popular=[],
}:{
  kind:Kind;collegeId:string;defaultValue?:string;
  popular:readonly Result[];
}){
  const [query,setQuery]=useState(defaultValue);
  const [matches,setMatches]=useState<Result[]>([]);
  const [popularResults,setPopularResults]=useState<Result[]>([]);
  const [recent,setRecent]=useState<string[]>([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);
  const requestNo=useRef(0);
  const popularityWriteRef=useRef(false);
  const storageKey="lms:college-directory-recent:"+collegeId+":"+kind;
  useEffect(()=>{
    try{
      const saved:unknown=JSON.parse(window.sessionStorage.getItem(storageKey)??"[]");
      if(Array.isArray(saved))setRecent(saved.filter((value):value is string=>
        typeof value==="string"&&value.length<=80).slice(0,6));
    }catch{setRecent([]);}
  },[storageKey]);
  useEffect(()=>{
    if(kind!=="FACULTY")return;
    const controller=new AbortController();
    void fetch("/api/college/roles/suggest/popular",{
      signal:controller.signal,credentials:"same-origin",cache:"no-store",
    }).then(async response=>{
      if(!response.ok)throw Error("POPULAR_FACULTY_UNAVAILABLE");
      const result=await response.json() as {items:Result[]};
      if(!controller.signal.aborted)setPopularResults(result.items.slice(0,10));
    }).catch(()=>{/* Keep page-scoped suggestions if popularity is offline. */});
    return ()=>controller.abort();
  },[kind,collegeId]);
  useEffect(()=>{
    const text=escapeQuery(query);
    const generation=++requestNo.current;
    if(text.length<2){setMatches([]);setLoading(false);setNotice("");return;}
    const controller=new AbortController();
    const handle=setTimeout(async()=>{
      setLoading(true);setNotice("");
      try{
        const params=new URLSearchParams({kind,q:text});
        const response=await fetch("/api/college/roles/suggest?"+params.toString(),{
          signal:controller.signal,cache:"no-store"});
        if(!response.ok)throw Error("SUGGEST_UNAVAILABLE");
        const data=await response.json() as {items:Result[]};
        if(generation===requestNo.current)setMatches(data.items);
      }catch{
        if(generation===requestNo.current&&!controller.signal.aborted){
          setMatches([]);setNotice("Suggestions unavailable; press Search to use the exact query.");
        }
      }finally{if(generation===requestNo.current)setLoading(false);}
    },200);
    return ()=>{clearTimeout(handle);controller.abort();};
  },[query,kind]);
  function remember(value:string){
    const term=escapeQuery(value);
    if(!term)return;
    const next=[term,...recent.filter(x=>x!==term)].slice(0,6);
    setRecent(next);
    try{window.sessionStorage.setItem(storageKey,JSON.stringify(next));}
    catch{/* Private mode: suggestions still work without browser storage. */}
  }
  async function choose(row:Result){
    const value=row.name;
    setQuery(value);remember(value);setOpen(false);
    // Persist popularity only for a real, same-college Faculty option.
    // A recent free-text term has no membership and cannot grant access.
    if(kind==="FACULTY"&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(row.membershipId)){
      if(popularityWriteRef.current)return;
      popularityWriteRef.current = true;
      try{
        await fetch("/api/college/roles/suggest/popular",{
          method:"POST",credentials:"same-origin",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({facultyMembershipId:row.membershipId}),
        });
      }catch{/* Search remains usable when auxiliary popularity is offline. */}
      finally{popularityWriteRef.current = false;}
    }
    if(inputRef.current){
      inputRef.current.value=value;inputRef.current.form?.requestSubmit();
    }
  }
  const showingLive=query.trim().length>=2;
  const choices=showingLive?matches:
    recent.map(value=>({membershipId:"recent:"+value,name:value}));
  return <div className="relative min-w-0">
    <Input ref={inputRef} className="min-h-11 w-full min-w-0 md:min-h-9"
      type="search" name="q" maxLength={100}
      value={query} placeholder="Search this college"
      role="combobox" aria-autocomplete="list" aria-expanded={open}
      aria-controls={"college-role-suggest-"+kind}
      onFocus={()=>setOpen(true)}
      onBlur={()=>{window.setTimeout(()=>setOpen(false),120);}}
      onChange={event=>{setQuery(event.target.value);setOpen(true);}}
      onKeyDown={event=>{if(event.key==="Enter")remember(query);
        if(event.key==="Escape")setOpen(false);}}
    />
    {open?<div id={"college-role-suggest-"+kind} role="listbox"
      aria-label={kind==="FACULTY"?"Faculty name suggestions":"Student suggestions"}
      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded border border-border bg-surface p-1 shadow-lg">
      <p className="px-2 py-1 text-xs text-muted-foreground">
        {loading?"Searching…":showingLive?"Matching this college":recent.length?"Recent searches":"Popular on this page"}
      </p>
      {(choices.length?choices:showingLive?[]:(popularResults.length?popularResults:popular).slice(0,6)).map(row=>
        <button type="button" role="option" aria-selected={query===row.name}
          key={row.membershipId} className="block min-h-9 w-full truncate rounded px-2 text-left text-sm text-body hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)]"
          onMouseDown={event=>event.preventDefault()} onClick={()=>void choose(row)}>
          {row.name}</button>)}
      {!choices.length&&showingLive&&!loading?
        <p className="px-2 py-1 text-xs text-muted-foreground">{notice||"No names match. Search all filters with the entered text."}</p>:null}
    </div>:null}
  </div>;
}
