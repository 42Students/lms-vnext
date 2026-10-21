"use client";

import {useEffect,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";

const PAGE_SIZES=[25,50,100,200] as const;

/** Persist only presentation preferences; never cache scoped roster data. */
export function AdminScopedRowsPerPage({initial,path,scopeKey,className}:{
 initial:number;path:string;scopeKey:string;className?:string;
}){
 const router=useRouter();
 const [selected,setSelected]=useState(initial);
 const [pending,startTransition]=useTransition();
 const storageKey=path==="/admin/faculty-assignment"?"admin-faculty-assignments-page-size":
  "admin-directory-page-size:"+scopeKey+":"+path;

 useEffect(()=>{
  setSelected(initial);
  const params=new URLSearchParams(window.location.search);
  if(params.has("pageSize"))return;
  try{
   const saved=Number(window.localStorage.getItem(storageKey));
   if(!PAGE_SIZES.some(size=>size===saved)||saved===initial)return;
   setSelected(saved);
   params.set("pageSize",String(saved));params.delete("page");
   startTransition(()=>router.replace(path+"?"+params.toString(),{scroll:false}));
  }catch{/* Browser storage is optional; the verified server default works. */}
 },[initial,path,router,startTransition,storageKey]);
 return <Select name="pageSize" aria-label="Rows per page" aria-busy={pending}
  value={selected} disabled={pending} className={className}
  onChange={event=>{
   const next=Number(event.target.value);
   if(!PAGE_SIZES.some(size=>size===next))return;
   setSelected(next);
   try{window.localStorage.setItem(storageKey,String(next));}catch{/* Optional. */}
   const params=new URLSearchParams(window.location.search);
   params.set("pageSize",String(next));params.delete("page");
   startTransition(()=>router.replace(path+"?"+params.toString(),{scroll:false}));
  }}>
  {PAGE_SIZES.map(size=><option value={size} key={size}>{size}</option>)}
 </Select>;
}
