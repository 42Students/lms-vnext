"use client";

import {useEffect,useState} from "react";
import {Alert} from "@/components/ui/alert";
import type {getPlacementTpoOperations} from "@/modules/placements/tpo-operations-service";
import {PlacementOperationsOverview} from "./placement-operations-overview";
import { TextLink } from "@/components/ui/text-link";

type Operations=Awaited<ReturnType<typeof getPlacementTpoOperations>>;

/** Retain the last authorized snapshot only while the same selected college
 * remains mounted. React state is intentionally ephemeral: no cross-tenant
 * sessionStorage cache or unverified browser restoration of recruiter data. */
export function PlacementOperationsSnapshot({
 collegeId,operations,basePath,staleDays,
}:{
 collegeId:string;
 operations:Operations|null;
 basePath:string;
 staleDays:number;
}){
 const [previous,setPrevious]=useState<Operations|null>(operations);
 useEffect(()=>{
  if(operations)setPrevious(operations);
 },[operations]);
 const shown=operations??previous;
 return <section aria-label="Placement drives" data-college-id={collegeId}>
  {!operations?<Alert tone="warning" role="alert">
   {shown
    ?"Could not refresh drives. Showing the last successful snapshot for this college."
    :"Couldn’t load drives. Check your connection and retry."}
   {" "}<TextLink href={basePath}>
    Retry
   </TextLink>
  </Alert>:null}
  {shown?<PlacementOperationsOverview operations={shown}
    basePath={basePath} showDriveSearch={basePath.startsWith("/admin/")}
    staleDays={staleDays}/>:null}
 </section>;
}
