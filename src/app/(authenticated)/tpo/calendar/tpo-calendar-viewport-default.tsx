"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {tpoCalendarViewForViewport} from "@/modules/placements/tpo-calendar-url-model";

/** Only initial defaults are responsive. An explicit ?view bookmark always wins. */
export function TpoCalendarViewportDefault({initialView,baseHref}:{
 initialView:"agenda"|"week"|"month";baseHref:string;
}){
 const router=useRouter();
 useEffect(()=>{
  const clientView=tpoCalendarViewForViewport(window.innerWidth);
  if(clientView===initialView)return;
  const url=new URL(baseHref,window.location.origin);
  url.searchParams.set("view",clientView);
  router.replace(url.pathname+url.search,{scroll:false});
 },[baseHref,initialView,router]);
 return null;
}
