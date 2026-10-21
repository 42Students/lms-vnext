"use client";
import { Input } from "@/components/ui/input";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

/** Only the selected-college server may supply suggestions; do not persist
 * names or lookups in browser storage across tenants. A missing provider
 * means no Popular group, rather than invented cross-college results. */
export function AdminScopedLiveSearch({initial,path,recentSuggestions=[],popularSuggestions=[]}:{
 initial:string;path:string;recentSuggestions?:readonly string[];popularSuggestions?:readonly string[];
}){
 const router=useRouter(),[value,setValue]=useState(initial);
 const [prevInitial,setPrevInitial]=useState(initial);
 const [focused,setFocused]=useState(false);
 if(prevInitial!==initial){setPrevInitial(initial);setValue(initial);}
 const normalized=value.trim().toLocaleLowerCase("en");
 function distinct(list:readonly string[]){
  const seen=new Set<string>();
  return list.filter(x=>typeof x==="string"&&x.trim().length>0&&x.length<=100)
   .filter(x=>{const key=x.toLocaleLowerCase("en");if(seen.has(key))return false;seen.add(key);return true;})
   .filter(x=>!normalized||x.toLocaleLowerCase("en").includes(normalized));
 }
 const recent=distinct(recentSuggestions).slice(0,15);
 const recentKeys=new Set(recent.map(x=>x.toLocaleLowerCase("en")));
 const popular=distinct(popularSuggestions).filter(x=>!recentKeys.has(x.toLocaleLowerCase("en")))
   .slice(0,Math.max(0,15-recent.length));
 const all=[...recent,...popular].slice(0,15);
 function navigate(next:string){
  const params=new URLSearchParams(window.location.search);
  next.trim()?params.set("q",next.trim()):params.delete("q");
  params.delete("page");
  router.replace(path+(params.size?"?"+params.toString():""),{scroll:false});
 }
 useEffect(()=>{
  if(value===initial)return;
  const handle=setTimeout(()=>navigate(value),200);
  return ()=>clearTimeout(handle);
 },[value,initial,path,router]);
 return <div className="relative space-y-1 print:hidden">
  <Input type="search" name="q" maxLength={100} value={value}
   onChange={event=>setValue(event.target.value)}
   onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
   aria-label="Search directory" placeholder="Search directory"
   role="combobox" aria-expanded={focused&&all.length>0}
   aria-controls="admin-scoped-search-suggestions"
   className="min-h-11 w-full md:min-h-9"/>
  {focused&&all.length>0?<div id="admin-scoped-search-suggestions"
    role="listbox" aria-label="Search suggestions"
    className="absolute left-0 right-0 top-full z-30 max-h-72 overflow-auto rounded border border-border bg-surface p-2 shadow-md">
    {recent.length?<div><p className="px-2 py-1 text-xs font-semibold">Recent</p>
      {recent.map(label=><button key={"recent:"+label} role="option" type="button" aria-selected={value===label}
        onMouseDown={event=>event.preventDefault()} onClick={()=>{setFocused(false);setValue(label);navigate(label);}}
        className="block min-h-9 w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted">{label}</button>)}
    </div>:null}
    {popular.length?<div><p className="px-2 py-1 text-xs font-semibold">Popular</p>
      {popular.map(label=><button key={"popular:"+label} role="option" type="button" aria-selected={value===label}
        onMouseDown={event=>event.preventDefault()} onClick={()=>{setFocused(false);setValue(label);navigate(label);}}
        className="block min-h-9 w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted">{label}</button>)}
    </div>:null}
  </div>:null}
  <p className="text-xs text-muted-foreground">Results refresh automatically as you search.</p>
 </div>;
}
