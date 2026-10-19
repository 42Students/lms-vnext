"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useId,useRef,useState} from "react";

type Item={id:string;name:string;displayName:string;category:string|null};
export function LearnerSkillCatalogInput({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const id=useId();
 const selectedSkill=useRef<string|null>(null);
 const [items,setItems]=useState<Item[]>([]);
 const [activeIndex,setActiveIndex]=useState(-1);
 const [status,setStatus]=useState<"loading"|"ready"|"unavailable">("loading");
 useEffect(()=>{
  const controller=new AbortController();
  if(selectedSkill.current===value)return ()=>controller.abort();
  const timer=window.setTimeout(async()=>{
   try{
    const params=new URLSearchParams({mode:value.trim()?"search":"popular",query:value.trim().slice(0,80),limit:"15"});
    const result=await fetch("/api/skills?"+params,{credentials:"same-origin",signal:controller.signal});
    if(!result.ok)throw new Error("CATALOG_UNAVAILABLE");
    const body=await result.json() as {items?:Item[]};
    setItems(Array.isArray(body.items)?body.items:[]);
    setActiveIndex(-1);
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
   onChange={event=>{selectedSkill.current=null;setStatus("loading");setItems([]);setActiveIndex(-1);onChange(event.target.value);}}
   onKeyDown={event=>{
     if(status!=="ready"||items.length===0)return;
     if(event.key==="ArrowDown"){event.preventDefault();setActiveIndex(index=>(index+1)%items.length);}
     else if(event.key==="ArrowUp"){event.preventDefault();setActiveIndex(index=>index<=0?items.length-1:index-1);}
     else if(event.key==="Enter"&&activeIndex>=0&&items[activeIndex]){
       event.preventDefault();selectedSkill.current=items[activeIndex]!.displayName;onChange(items[activeIndex]!.displayName);setItems([]);setActiveIndex(-1);
     }else if(event.key==="Escape"){setItems([]);setActiveIndex(-1);}
   }}
   placeholder="Search and select skills..."
   role="combobox" aria-autocomplete="list" aria-expanded={status==="ready"&&items.length>0}
   aria-controls={id+"-choices"}
   aria-activedescendant={activeIndex>=0?`${id}-choice-${activeIndex}`:undefined}
   className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"/>
  {status==="loading"?<p role="status" className="mt-1 text-xs text-muted-foreground">Searching skills…</p>:null}
  {status==="ready"&&items.length===0?<p role="status" className="mt-1 text-xs text-muted-foreground">
    No catalog suggestions found. You can still save your own skill name.
  </p>:null}
  {status==="unavailable"?<p role="status" className="mt-1 text-xs text-body">
   Skill catalog temporarily unavailable. You can save the entered skill name.
  </p>:null}
  {status==="ready"&&items.length>0?<ul id={id+"-choices"} role="listbox"
    className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-[var(--lms-control-radius)] border border-border bg-surface p-1">
    {items.map((item,index)=><li id={id+"-choice-"+index} key={item.id} role="option" aria-selected={activeIndex===index||item.displayName===value}>
      <Button variant="primary" type="button" className="w-full text-left"
       onClick={()=>{selectedSkill.current=item.displayName;onChange(item.displayName);setItems([]);setActiveIndex(-1);}}>
       {item.displayName}{item.category?<span className="ml-2 text-xs text-muted-foreground">{item.category}</span>:null}
      </Button>
    </li>)}
  </ul>:null}
 </div>;
}
