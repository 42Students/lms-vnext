"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy admin list behaviour: select filters apply immediately and search
 * inputs debounce. A query change resets the current page but retains all
 * other visible inputs. Enhanced navigation keeps the form usable without JS. */
export function CollegeDirectoryInstantFilters({formId}: {formId:string}) {
  const router=useRouter();
  useEffect(()=>{
    const form=document.getElementById(formId);
    if(!(form instanceof HTMLFormElement))return;
    let timer:ReturnType<typeof setTimeout>|null=null;
    const submit=()=>{
      if(timer){clearTimeout(timer);timer=null;}
      const params=new URLSearchParams();
      const values=new FormData(form);
      for(const [key,value] of values.entries()){
        if(typeof value==="string"&&value.trim())params.append(key,value);
      }
      params.delete("page");
      router.replace(window.location.pathname+"?"+params.toString(),{scroll:false});
    };
    const onChange=(event:Event)=>{
      const target=event.target;
      if(target instanceof HTMLSelectElement)submit();
      if(target instanceof HTMLInputElement && target.type!=="search")submit();
    };
    const onInput=(event:Event)=>{
      const target=event.target;
      if(target instanceof HTMLInputElement&&target.type==="search"){
        if(timer)clearTimeout(timer);
        timer=setTimeout(submit,350);
      }
    };
    // FilterBar's search control is visually outside the form and linked
    // through the native form attribute. It participates in FormData, but its
    // DOM events do not bubble into the form element.
    const externalFields=[...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      '[form="'+formId+'"]',
    )].filter(field=>!form.contains(field));
    form.addEventListener("change",onChange);
    form.addEventListener("input",onInput);
    for(const field of externalFields){
      field.addEventListener("change",onChange);
      field.addEventListener("input",onInput);
    }
    return ()=>{
      form.removeEventListener("change",onChange);
      form.removeEventListener("input",onInput);
      for(const field of externalFields){
        field.removeEventListener("change",onChange);
        field.removeEventListener("input",onInput);
      }
      if(timer)clearTimeout(timer);
    };
  },[formId,router]);
  return null;
}
