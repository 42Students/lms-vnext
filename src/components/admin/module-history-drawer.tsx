"use client";
import {useRouter} from "next/navigation";
import type {ReactNode} from "react";
import {Drawer} from "@/components/ui/drawer";
/** History opens after a scoped route navigation, so the database read is
 * lazy and can be reloaded without fetching hierarchy data. Native dialog
 * handles Escape, backdrop, focus recovery and phone full-width layout. */
export function ModuleHistoryDrawer({collegeId,children}:{
 collegeId:string;children:ReactNode;
}){
 const router=useRouter(),back="/admin/features/"+encodeURIComponent(collegeId);
 return <Drawer open title="Recent changes" description="History of stored Projects, Placements and Electives access rules"
  historyMode="route" className="md:!w-[min(640px,100vw)]"
  onOpenChange={next=>{if(!next)router.replace(back);}}>
  {children}
 </Drawer>;
}
