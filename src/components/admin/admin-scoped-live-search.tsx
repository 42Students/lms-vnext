"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
export function AdminScopedLiveSearch({initial,path}:{initial:string;path:string}){
 const router=useRouter(),[value,setValue]=useState(initial);
 useEffect(()=>setValue(initial),[initial]);
 useEffect(()=>{
  if(value===initial)return;
  const handle=setTimeout(()=>{
   const params=new URLSearchParams(window.location.search);
   value.trim()?params.set("q",value.trim()):params.delete("q");
   params.delete("page");
   router.replace(path+(params.size?"?"+params.toString():""),{scroll:false});
  },400);
  return ()=>clearTimeout(handle);
 },[value,initial,path,router]);
 return <div className="space-y-1">
  <input type="search" name="q" maxLength={100} value={value}
   onChange={event=>setValue(event.target.value)}
   aria-label="Search directory" placeholder="Search directory"
   className="min-h-11 min-w-0 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
  <p className="text-xs text-muted-foreground">Results refresh automatically as you search.</p>
 </div>;
}
