"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useId,useRef,useState} from "react";
import { Input } from "@/components/ui/input";
import { PopoverListbox } from "@/components/ui/popover";

export type CatalogSkillItem={id:string;name:string;displayName:string;category:string|null};
export type CatalogSkillSelection={skill:string;skillId?:string;proficiency?:string};
type Item=CatalogSkillItem;
export function LearnerSkillCatalogInput({value,onChange,disabled=false,showPopular=true,maxResults=15,onSelectSkill}:{
 value:string;onChange:(value:string)=>void;disabled?:boolean;showPopular?:boolean;maxResults?:number;
 onSelectSkill?:(item:CatalogSkillItem)=>void;
}){
 const id=useId();
 const selectedSkill=useRef<string|null>(null);
 const rootRef=useRef<HTMLDivElement>(null);
 const [popupOpen,setPopupOpen]=useState(false);
 const [items,setItems]=useState<Item[]>([]);
 const [activeIndex,setActiveIndex]=useState(-1);
 const [status,setStatus]=useState<"loading"|"ready"|"unavailable"|"too_long">("loading");
 const [selectionFeedback,setSelectionFeedback]=useState("");
 useEffect(()=>{
  const controller=new AbortController();
  if(disabled||selectedSkill.current===value)return ()=>controller.abort();
  if(value.trim().length>80){setStatus("too_long");setItems([]);return ()=>controller.abort();}
  if(!value.trim()&&!showPopular){setStatus("ready");setItems([]);return ()=>controller.abort();}
  const timer=window.setTimeout(async()=>{
   try{
    const params=new URLSearchParams({mode:value.trim()?"search":"popular",query:value.trim(),limit:String(Math.min(50,Math.max(1,Math.trunc(maxResults))))});
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
 },[value,disabled,showPopular,maxResults]);
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
 function choose(item:Item){
  selectedSkill.current=item.displayName;
  setSelectionFeedback("");
  onSelectSkill?.(item);
  onChange(item.displayName);
  setPopupOpen(false);setActiveIndex(-1);
  // Legacy counts *explicit catalog selections*, not text input edits or profile saves.
  void fetch("/api/skills/selection",{
   method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
   body:JSON.stringify({requestId:crypto.randomUUID(),skillIds:[item.id]}),
  }).then(response=>{
   if(response.ok)setSelectionFeedback("Selection recorded");
   else if(response.status!==503)setSelectionFeedback("Couldn't record skill selection");
  }).catch(()=>setSelectionFeedback("Couldn't record skill selection"));
 }
 return <div ref={rootRef} data-slot="searchable-select" className="relative min-w-0 md:col-span-2"
  onBlur={event=>{
   if(!event.currentTarget.contains(event.relatedTarget)){setPopupOpen(false);setActiveIndex(-1);}
  }}>
  <label htmlFor={id} className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Skill</label>
  <Input id={id} value={value} maxLength={160} disabled={disabled} autoComplete="off"
   onFocus={()=>setPopupOpen(true)}
   onChange={event=>{selectedSkill.current=null;setSelectionFeedback("");setPopupOpen(true);setStatus(event.target.value.trim().length>80?"too_long":"loading");setItems([]);setActiveIndex(-1);onChange(event.target.value);}}
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
       event.preventDefault();choose(items[activeIndex]!);
     }else if(event.key==="Escape"){event.preventDefault();event.stopPropagation();setPopupOpen(false);setActiveIndex(-1);}
   }}
   placeholder="Search and select skills..."
   role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={popupOpen&&status==="ready"&&items.length>0}
   aria-controls={popupOpen&&status==="ready"&&items.length>0?id+"-choices":undefined}
   aria-activedescendant={popupOpen&&status==="ready"&&activeIndex>=0&&activeIndex<items.length?`${id}-choice-${activeIndex}`:undefined}
   className="mt-[6px] w-full"/>
  {popupOpen&&status==="too_long"?<p role="alert" className="mt-1 text-xs text-danger-text">Search up to 80 characters. You can still save the skill name.</p>:null}
  {selectionFeedback?<p role="status" className="mt-1 text-xs text-muted-foreground">{selectionFeedback}</p>:null}
  {popupOpen&&status==="loading"?<p role="status" className="mt-1 text-xs text-muted-foreground">Searching skills…</p>:null}
  {popupOpen&&status==="ready"&&items.length===0?<p role="status" className="mt-1 text-xs text-muted-foreground">
    No catalog suggestions found. You can still save your own skill name.
  </p>:null}
  {popupOpen&&status==="unavailable"?<p role="status" className="mt-1 text-xs text-body">
   Failed to search skills. Please try again or contact support. You can still save the entered skill name.
  </p>:null}
  {popupOpen&&status==="ready"&&items.length>0?<PopoverListbox id={id+"-choices"} label="Suggested skills"
    className="absolute left-0 top-full z-[var(--lms-z-dropdown)] mt-[var(--lms-space-2)] max-h-48 w-full min-w-0 overflow-y-auto" onDismiss={() => {setPopupOpen(false);setActiveIndex(-1);}}>
    <ul className="m-0 divide-y divide-[var(--lms-canvas-border)] list-none p-0">
    {items.map((item,index)=><li id={id+"-choice-"+index} key={item.id} role="option" aria-selected={activeIndex===index||item.displayName===value} className="min-h-11">
      <Button type="button" variant="ghost" className="!min-h-11 w-full min-w-0 justify-start !rounded-none !px-[var(--lms-space-3)] !py-[var(--lms-space-2)] text-left text-[13px] !transition-[background-color] !duration-[200ms] !ease-in-out hover:!bg-[var(--lms-primary-subtle)]"
       onClick={()=>choose(item)}>
       <span className="min-w-0 flex-1 truncate">{item.displayName}</span>{item.category?<span className="ml-[var(--lms-space-2)] max-w-[45%] min-w-0 truncate text-xs text-muted-foreground">{item.category}</span>:null}
      </Button>
    </li>)}
  </ul>
  </PopoverListbox>:null}
 </div>;
}
