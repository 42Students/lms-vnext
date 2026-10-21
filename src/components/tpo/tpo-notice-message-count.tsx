"use client";
import {useEffect,useState} from "react";

/** Live legacy showCount, including drafts restored after validation/navigation. */
export function TpoNoticeMessageCount({formId,outputId}:{formId:string;outputId:string}){
 const [count,setCount]=useState(0);
 useEffect(()=>{
  const form=document.getElementById(formId);
  if(!(form instanceof HTMLFormElement))return;
  const field=form.elements.namedItem("message");
  if(!(field instanceof HTMLTextAreaElement))return;
  const update=()=>setCount(field.value.length);
  update();
  // The draft guard can restore this field asynchronously after mount.
  const observer=new MutationObserver(update);
  observer.observe(field,{attributes:true,attributeFilter:["value"]});
  field.addEventListener("input",update);
  field.addEventListener("change",update);
  return ()=>{
   observer.disconnect();
   field.removeEventListener("input",update);
   field.removeEventListener("change",update);
  };
 },[formId]);
 return <output id={outputId} htmlFor={formId} aria-live="polite"
   className="block text-right text-xs tabular-nums text-muted-foreground">
   {count.toLocaleString("en-IN")} / 8,000
 </output>;
}
