"use client";
import { Button } from "@/components/ui/button";

import { useRef } from "react";
import { DataTable } from "@/components/ui/data-table";

type Run = {when:string;students:number;created:number;failed:number};

/** SA-academics-people-95: audit-backed import history, scoped by the server. */
export function SuperAdminStudentImportHistory({runs}:{runs:readonly Run[]}) {
  const dialogRef=useRef<HTMLDialogElement>(null);
  const triggerRef=useRef<HTMLButtonElement>(null);
  return <>
    <Button variant="secondary" ref={triggerRef} type="button" onClick={()=>dialogRef.current?.showModal()}
      className="">
      Import History
    </Button>
    <dialog ref={dialogRef} aria-label="Bulk import history"
      onClose={()=>triggerRef.current?.focus()}
      className="w-[min(92vw,48rem)] max-h-[calc(100dvh-2rem)] overflow-hidden overscroll-contain rounded-[12px] border border-border bg-surface p-5 text-foreground shadow-[0_8px_30px_rgba(26,45,72,.1)] backdrop:bg-black/50 [&[open]]:flex [&[open]]:flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Bulk import history</h2>
        <Button variant="secondary" type="button" onClick={()=>dialogRef.current?.close()}
          className="">Close</Button>
      </div>
      <div role="region" aria-label="Bulk import history records" tabIndex={0}
        className="mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [mask-image:linear-gradient(to_bottom,black_92%,transparent_100%)]">
        <DataTable caption="Bulk import history records"
          rows={runs.map((run,index)=>({...run,index}))}
          getRowKey={run=>String(run.index)}
          empty={<p role="status" className="text-sm text-body">No bulk imports on file for this college.</p>}
          columns={[
            {key:"when",header:"When",mobilePriority:"primary",cell:run=>run.when},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:run=>run.students},
            {key:"created",header:"Created",mobilePriority:"secondary",cell:run=>run.created},
            {key:"failed",header:"Failed",mobilePriority:"secondary",cell:run=>run.failed},
          ]}/>
      </div>
    </dialog>
  </>;
}
