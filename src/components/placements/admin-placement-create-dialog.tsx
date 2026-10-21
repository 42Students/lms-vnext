"use client";

import type {ReactNode} from "react";
import {useRouter} from "next/navigation";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

/** The canonical /admin/placements/new URL owns the 800px legacy modal.
 * Closing returns to the scoped drive directory. The existing workspace
 * owns server validation and post-save navigation; no draft is synthesized. */
export function AdminPlacementCreateDialog({children}:{children:ReactNode}){
 const router=useRouter();
 function close(){router.push("/admin/placements");router.refresh();}
 return <Dialog open onOpenChange={next=>{if(!next)close();}}
   title="Create Drive" description="Build the opportunity students will see."
   historyMode="route" className="!max-w-[800px]"
   footer={<Button type="button" variant="secondary" onClick={close}>Close</Button>}>
   {children}
 </Dialog>;
}
