"use client";

import { useRef } from "react";
import { DataTable } from "@/components/ui/data-table";

type Run = {when:string;students:number;created:number;failed:number};

/** SA-academics-people-95: audit-backed import history, scoped by the server. */
export function SuperAdminStudentImportHistory({runs}:{runs:readonly Run[]}) {
  const dialogRef=useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={()=>dialogRef.current?.showModal()}
      className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">
      Import History
    </button>
    <dialog ref={dialogRef} aria-label="Bulk import history"
      className="w-[min(92vw,48rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_92%,transparent_100%)] rounded-xl border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/50">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Bulk import history</h2>
        <button type="button" onClick={()=>dialogRef.current?.close()}
          className="min-h-11 rounded border border-border px-4 font-semibold">Close</button>
      </div>
      <div role="region" aria-label="Bulk import history records" tabIndex={0}
        className="mt-4 max-h-[60dvh] overflow-x-auto overscroll-x-contain overflow-y-auto overscroll-contain">
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
