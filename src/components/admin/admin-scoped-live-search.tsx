"use client";
import { Input } from "@/components/ui/input";
import {useEffect,useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";

/** Only the selected-college server may supply suggestions; do not persist
 * names or lookups in browser storage across tenants. A missing provider
 * means no Popular group, rather than invented cross-college results. */
export function AdminScopedLiveSearch({initial,path,placeholder,recentSuggestions=[],popularSuggestions=[],searchResults=[],hasResults}:{
 initial:string;path:string;placeholder?:string;recentSuggestions?:readonly string[];
 popularSuggestions?:readonly string[];searchResults?:readonly string[];hasResults?:boolean|null;
}){
 const audience=path.includes("faculty")?"faculty":path.includes("student")?"students":"directory";
 const searchPlaceholder=placeholder??(audience==="students"
  ?"Search students by name, email, roll number, or mobile (e.g., 'john', 'std', 'roll123')..."
  :audience==="faculty"?"Search faculty by name, email, or mobile...":"Search directory");
 const router=useRouter(),[value,setValue]=useState(initial);
 const [isPending,startTransition]=useTransition();
 const [active,setActive]=useState(-1);
 const [prevInitial,setPrevInitial]=useState(initial);
 const [focused,setFocused]=useState(false);
 const [remote,setRemote]=useState<{recent:string[];popular:string[];results:string[]}|null>(null);
 const [lookingUp,setLookingUp]=useState(false);
 const latestRequest=useRef(0);
 useEffect(()=>{
  // Delay both URL updates and remote suggestions. Ignore replies from an
  // earlier query or previous selected college (this component remounts per
  // scoped page as its signed-in permission context changes).
  if(audience==="directory")return;
  const id=++latestRequest.current;
  const controller=new AbortController();
  const handle=setTimeout(async()=>{
   setLookingUp(true);
   try{
    const response=await fetch("/api/admin/scoped-search-suggestions?"+
      new URLSearchParams({kind:audience==="faculty"?"FACULTY":"LEARNER",q:value.trim()}),{
      credentials:"same-origin",cache:"no-store",signal:controller.signal,
     });
    if(!response.ok)throw new Error("SUGGESTIONS_UNAVAILABLE");
    const result:unknown=await response.json();
    if(latestRequest.current!==id)return;
    if(!result||typeof result!=="object"||Array.isArray(result))return;
    const record=result as Record<string,unknown>;
    const strings=(v:unknown)=>Array.isArray(v)?
      v.filter((x):x is string=>typeof x==="string"&&x.length<=100).slice(0,15):[];
    setRemote({recent:strings(record["recent"]),popular:strings(record["popular"]),
      results:strings(record["results"])});
   }catch{
    // A transient lookup error must not convert old-stale data into a new
    // authoritative suggestion. The regular directory search still works.
    if(latestRequest.current===id)setRemote(null);
   }finally{if(latestRequest.current===id)setLookingUp(false);}
  },200);
  return ()=>{clearTimeout(handle);controller.abort();};
 },[audience,value]);
 if(prevInitial!==initial){setPrevInitial(initial);setValue(initial);setActive(-1);}
 const normalized=value.trim().toLocaleLowerCase("en");
 function distinct(list:readonly string[]){
  const seen=new Set<string>();
  return list.filter(x=>typeof x==="string"&&x.trim().length>0&&x.length<=100)
   .filter(x=>{const key=x.toLocaleLowerCase("en");if(seen.has(key))return false;seen.add(key);return true;})
   .filter(x=>!normalized||x.toLocaleLowerCase("en").includes(normalized));
 }
 const recent=distinct(remote?.recent??recentSuggestions).slice(0,15);
 const recentKeys=new Set(recent.map(x=>x.toLocaleLowerCase("en")));
 const popular=distinct(remote?.popular??popularSuggestions).filter(x=>!recentKeys.has(x.toLocaleLowerCase("en")))
   .slice(0,Math.max(0,15-recent.length));
 const popularKeys=new Set(popular.map(x=>x.toLocaleLowerCase("en")));
 const results=distinct(remote?.results??searchResults).filter(x=>!recentKeys.has(x.toLocaleLowerCase("en"))&&
  !popularKeys.has(x.toLocaleLowerCase("en"))).slice(0,Math.max(0,15-recent.length-popular.length));
 const all=[...recent,...popular,...results].slice(0,15);
 function navigate(next:string){
  const params=new URLSearchParams(window.location.search);
  next.trim()?params.set("q",next.trim()):params.delete("q");
  params.delete("page");
  startTransition(()=>router.replace(path+(params.size?"?"+params.toString():""),{scroll:false}));
 }
 useEffect(()=>{
  if(value===initial)return;
  const handle=setTimeout(()=>navigate(value),200);
  return ()=>clearTimeout(handle);
 },[value,initial,path,router]);
 return <div className="relative space-y-1 print:hidden">
  <Input type="search" name="q" maxLength={100} value={value}
   onChange={event=>{setValue(event.target.value);setActive(-1);}}
   onFocus={()=>setFocused(true)} onBlur={()=>{setFocused(false);setActive(-1);}}
   onKeyDown={event=>{
    if(event.key==="Escape"){setFocused(false);setActive(-1);return;}
    if(!all.length)return;
    if(event.key==="ArrowDown"){event.preventDefault();setFocused(true);setActive(prev=>(prev+1)%all.length);}
    if(event.key==="ArrowUp"){event.preventDefault();setFocused(true);setActive(prev=>prev<=0?all.length-1:prev-1);}
    if(event.key==="Enter"&&focused&&active>=0){const selected=all[active];if(selected!==undefined){event.preventDefault();setValue(selected);setFocused(false);setActive(-1);navigate(selected);}}
   }}
   aria-label={"Search "+audience} placeholder={searchPlaceholder}
   role="combobox" aria-busy={isPending||lookingUp} aria-expanded={focused&&all.length>0}
   aria-controls="admin-scoped-search-suggestions"
   aria-autocomplete="list" aria-activedescendant={focused&&active>=0?"admin-scoped-suggestion-"+active:undefined}
   className="min-h-11 w-full md:min-h-9"/>
  {focused&&all.length>0?<div id="admin-scoped-search-suggestions"
    role="listbox" aria-label="Search suggestions"
    className="absolute left-0 right-0 top-full z-30 max-h-72 overflow-auto rounded border border-border bg-surface p-2 shadow-md">
    {recent.length?<div><p className="px-2 py-1 text-xs font-semibold">Recent</p>
      {recent.map((label,index)=><button key={"recent:"+label} id={"admin-scoped-suggestion-"+index} role="option" type="button" aria-selected={value===label||active===index}
        onMouseDown={event=>event.preventDefault()} onClick={()=>{setFocused(false);setValue(label);navigate(label);}}
        className="block min-h-9 w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted">{label}</button>)}
    </div>:null}
    {popular.length?<div><p className="px-2 py-1 text-xs font-semibold">Popular</p>
      {popular.map((label,index)=><button key={"popular:"+label} id={"admin-scoped-suggestion-"+(recent.length+index)} role="option" type="button" aria-selected={value===label||active===recent.length+index}
        onMouseDown={event=>event.preventDefault()} onClick={()=>{setFocused(false);setValue(label);navigate(label);}}
        className="block min-h-9 w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted">{label}</button>)}
    </div>:null}
    {results.length?<div><p className="px-2 py-1 text-xs font-semibold">Search Results</p>
      {results.map((label,index)=><button key={"search:"+label}
        id={"admin-scoped-suggestion-"+(recent.length+popular.length+index)}
        role="option" type="button" aria-selected={active===recent.length+popular.length+index}
        onMouseDown={event=>event.preventDefault()} onClick={()=>{setFocused(false);setValue(label);navigate(label);}}
        className="block min-h-9 w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted">{label}</button>)}
    </div>:null}
  </div>:null}
  <p role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
   {isPending||lookingUp?<><span aria-hidden="true" className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"/>Searching {audience}…</>:
    hasResults===false?audience==="faculty"?"No faculty found. Try a different search.":
     audience==="students"?"No students found. Try a different search.":
     "No records found. Try a different search.":
     "Results refresh automatically as you search."}
  </p>
  {hasResults===false&&!isPending&&!lookingUp?<button type="button" className="min-h-9 text-xs font-semibold text-link underline"
    onClick={()=>navigate(value)}>Retry search</button>:null}
 </div>;
}
