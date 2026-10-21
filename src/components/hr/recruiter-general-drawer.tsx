"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/** The right-edge 480px General conversation replaces the legacy Ant Drawer.
 * Existing reply form state stays mounted when the native dialog is closed.
 */
export function RecruiterGeneralDrawer({children}:{children:ReactNode}) {
  const [open,setOpen]=useState(false);
  return <>
    <Button type="button" onClick={()=>setOpen(true)}
      className="min-h-11 w-full whitespace-normal md:min-h-9 md:w-auto">
      Message the placement cell
    </Button>
    <Dialog open={open} onOpenChange={setOpen} title="Placement cell · General"
      description="A private conversation with your college placement cell, separate from a hiring drive."
      className="!left-auto !right-0 !top-0 !h-dvh !max-h-dvh !w-[min(480px,100vw)] !max-w-[480px] !translate-x-0 !translate-y-0 !rounded-none md:!rounded-l-[var(--lms-canvas-radius)]"
      bodyClassName="!p-4 md:!p-6">
      {children}
    </Dialog>
  </>;
}
