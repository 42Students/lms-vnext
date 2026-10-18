"use client";

import { useRef } from "react";

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
      {runs.length ? <div role="region" aria-label="Bulk import history records" tabIndex={0} className="mt-4 overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,black_90%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-border">
            <th scope="col" className="p-2">When</th>
            <th scope="col" className="p-2">Students</th>
            <th scope="col" className="p-2">Created</th>
            <th scope="col" className="p-2">Failed</th>
          </tr></thead>
          <tbody>{runs.map((run,index)=><tr key={index} className="border-b border-border">
            <td className="p-2">{run.when}</td><td className="p-2">{run.students}</td>
            <td className="p-2">{run.created}</td><td className="p-2">{run.failed}</td>
          </tr>)}</tbody>
        </table>
      </div>:<p role="status" className="mt-4 text-sm text-body">No bulk imports on file for this college.</p>}
    </dialog>
  </>;
}
