"use client";
import { Input } from "@/components/ui/input";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
export function AdminScopedLiveSearch({initial,path}:{initial:string;path:string}){
 const router=useRouter(),[value,setValue]=useState(initial);
 const [prevInitial,setPrevInitial]=useState(initial);
 if(prevInitial!==initial){setPrevInitial(initial);setValue(initial);}
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
 return <div className="space-y-1 print:hidden">
  <Input type="search" name="q" maxLength={100} value={value}
   onChange={event=>setValue(event.target.value)}
   aria-label="Search directory" placeholder="Search directory"
   className="min-h-11 w-full md:min-h-9"/>
  <p className="text-xs text-muted-foreground">Results refresh automatically as you search.</p>
 </div>;
}
