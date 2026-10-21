"use client";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

export function ProjectAuditActionSelect({basePath,query,selected,options}:{
 basePath:string;query:string;selected:string;options:readonly {value:string;label:string}[];
}){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 function change(action:string){
  const params=new URLSearchParams(query);
  if(action)params.set("action",action);else params.delete("action");
  params.delete("beforeOccurredAt");params.delete("beforeId");params.delete("page");
  startTransition(()=>router.push(basePath+"/audit"+(params.size?"?"+params.toString():"")));
 }
 return <Select name="action" aria-label="Filter by action" value={selected} disabled={pending}
  onChange={event=>change(event.target.value)}>
  <option value="">Filter by action</option>
  {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
 </Select>;
}

export function ProjectAuditRefreshButton(){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 return <Button variant="secondary" type="button" disabled={pending} loading={pending}
  onClick={()=>startTransition(()=>router.refresh())}>
  <span aria-hidden="true">↻</span> {pending?"Refreshing…":"Refresh"}
 </Button>;
}
