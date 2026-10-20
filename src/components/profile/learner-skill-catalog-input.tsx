"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useId,useRef,useState} from "react";
import { Input } from "@/components/ui/input";
import { PopoverListbox } from "@/components/ui/popover";

type Item={id:string;name:string;displayName:string;category:string|null};
export function LearnerSkillCatalogInput({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const id=useId();
 const selectedSkill=useRef<string|null>(null);
 const rootRef=useRef<HTMLDivElement>(null);
 const [popupOpen,setPopupOpen]=useState(true);
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
 useEffect(()=>{
  if(!popupOpen)return;
  const outside=(event:PointerEvent)=>{
   if(event.target instanceof Node && !rootRef.current?.contains(event.target)){
    setPopupOpen(false);setActiveIndex(-1);
   }
  };
  document.addEventListener("pointerdown",outside);
  return ()=>document.removeEventListener("pointerdown",outside);
 },[popupOpen]);
 return <div ref={rootRef} data-slot="searchable-select" className="relative min-[768px]:col-span-2"
  onBlur={event=>{
   if(!event.currentTarget.contains(event.relatedTarget)){setPopupOpen(false);setActiveIndex(-1);}
  }}>
  <label htmlFor={id} className="text-xs font-semibold text-body">Skill</label>
  <Input id={id} value={value} maxLength={160} autoComplete="off"
   onFocus={()=>setPopupOpen(true)}
   onChange={event=>{selectedSkill.current=null;setPopupOpen(true);setStatus("loading");setItems([]);setActiveIndex(-1);onChange(event.target.value);}}
   onKeyDown={event=>{
     if(status!=="ready"||items.length===0)return;
     if(!popupOpen){
       if(event.key==="ArrowDown"||event.key==="ArrowUp"){
         event.preventDefault();setPopupOpen(true);setActiveIndex(event.key==="ArrowDown"?0:items.length-1);
       }
       return;
     }
     if(event.key==="ArrowDown"){event.preventDefault();setActiveIndex(index=>(index+1)%items.length);}
     else if(event.key==="ArrowUp"){event.preventDefault();setActiveIndex(index=>index<=0?items.length-1:index-1);}
     else if(event.key==="Enter"&&activeIndex>=0&&items[activeIndex]){
       event.preventDefault();selectedSkill.current=items[activeIndex]!.displayName;onChange(items[activeIndex]!.displayName);setItems([]);setActiveIndex(-1);
     }else if(event.key==="Escape"){event.preventDefault();event.stopPropagation();setPopupOpen(false);setActiveIndex(-1);}
   }}
   placeholder="Search and select skills..."
   role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={popupOpen&&status==="ready"&&items.length>0}
   aria-controls={popupOpen&&status==="ready"&&items.length>0?id+"-choices":undefined}
   aria-activedescendant={popupOpen&&status==="ready"&&activeIndex>=0&&activeIndex<items.length?`${id}-choice-${activeIndex}`:undefined}
   className="mt-1 min-h-11 min-[768px]:min-h-9 w-full"/>
  {status==="loading"?<p role="status" className="mt-1 text-xs text-muted-foreground">Searching skills…</p>:null}
  {status==="ready"&&items.length===0?<p role="status" className="mt-1 text-xs text-muted-foreground">
    No catalog suggestions found. You can still save your own skill name.
  </p>:null}
  {status==="unavailable"?<p role="status" className="mt-1 text-xs text-body">
   Skill catalog temporarily unavailable. You can save the entered skill name.
  </p>:null}
  {popupOpen&&status==="ready"&&items.length>0?<PopoverListbox id={id+"-choices"} label="Suggested skills"
    className="absolute left-0 top-[calc(100%_+_5px)] z-[var(--lms-z-dropdown)] max-h-[200px] min-h-[120px] w-full overflow-y-auto pt-[5px]" onDismiss={() => {setPopupOpen(false);setActiveIndex(-1);}}>
    <ul className="m-0 list-none p-0">
    {items.map((item,index)=><li id={id+"-choice-"+index} key={item.id} role="option" aria-selected={activeIndex===index||item.displayName===value} className="min-h-11">
      <Button type="button" variant="ghost" className="!min-h-11 w-full justify-start !rounded-none !px-[10px] !py-[5px] text-left text-sm !transition-[background-color] !duration-[200ms] !ease-in-out hover:!bg-[#d1f1f1]"
       onClick={()=>{selectedSkill.current=item.displayName;onChange(item.displayName);setPopupOpen(false);setItems([]);setActiveIndex(-1);}}>
       {item.displayName}{item.category?<span className="ml-2 text-xs text-muted-foreground">{item.category}</span>:null}
      </Button>
    </li>)}
  </ul>
  </PopoverListbox>:null}
 </div>;
}
