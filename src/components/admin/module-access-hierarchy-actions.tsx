"use client";
import {Button} from "@/components/ui/button";
/** All/none disclosure controls leave permissions and persisted rules intact. */
export function ModuleAccessHierarchyActions(){
 function toggleAll(open:boolean){
  const root=document.querySelector("[data-module-access-hierarchy]");
  root?.querySelectorAll("details").forEach(item=>{item.open=open;});
 }
 return <>
  <Button type="button" variant="secondary" onClick={()=>toggleAll(true)}
   className="min-h-11 md:min-h-9">Expand all</Button>
  <Button type="button" variant="secondary" onClick={()=>toggleAll(false)}
   className="min-h-11 md:min-h-9">Collapse all</Button>
 </>;
}
