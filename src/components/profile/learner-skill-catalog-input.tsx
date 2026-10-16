"use client";
import {useEffect,useId,useState} from "react";

type Item={id:string;name:string;displayName:string;category:string|null};
export function LearnerSkillCatalogInput({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const id=useId();
 const [items,setItems]=useState<Item[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"unavailable">("loading");
 useEffect(()=>{
  const controller=new AbortController();
  const timer=window.setTimeout(async()=>{
   try{
    const params=new URLSearchParams({mode:value.trim()?"search":"popular",query:value.trim().slice(0,80),limit:"15"});
    const result=await fetch("/api/skills?"+params,{credentials:"same-origin",signal:controller.signal});
    if(!result.ok)throw new Error("CATALOG_UNAVAILABLE");
    const body=await result.json() as {items?:Item[]};
    setItems(Array.isArray(body.items)?body.items:[]);
    setStatus("ready");
   }catch{
    if(!controller.signal.aborted)setStatus("unavailable");
   }
  },200);
  return ()=>{controller.abort();window.clearTimeout(timer);};
 },[value]);
 return <div className="sm:col-span-2">
  <label htmlFor={id} className="text-xs font-semibold text-body">Skill</label>
  <input id={id} value={value} maxLength={160} autoComplete="off"
   onChange={event=>onChange(event.target.value)}
   placeholder="Search and select skills..."
   role="combobox" aria-autocomplete="list" aria-expanded={status==="ready"&&items.length>0}
   aria-controls={id+"-choices"}
   className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"/>
  {status==="unavailable"?<p role="status" className="mt-1 text-xs text-body">
   Skill catalog temporarily unavailable. You can save the entered skill name.
  </p>:null}
  {status==="ready"&&items.length>0?<ul id={id+"-choices"} role="listbox"
    className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-1">
    {items.map(item=><li key={item.id} role="option" aria-selected={item.displayName===value}>
      <button type="button" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-surface-secondary"
       onClick={()=>onChange(item.displayName)}>
       {item.displayName}{item.category?<span className="ml-2 text-xs text-muted-foreground">{item.category}</span>:null}
      </button>
    </li>)}
  </ul>:null}
 </div>;
}
