"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";

type Run = { when: string; students: number; created: number; failed: number };

/** SA-academics-people-95: audit-backed import history, scoped by the server. */
export function SuperAdminStudentImportHistory({ runs }: { runs: readonly Run[] }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" onClick={() => setOpen(true)}>
      Import History
    </Button>
    <Dialog open={open} onOpenChange={setOpen} title="Bulk import history"
      className="max-w-[48rem]" bodyClassName="min-h-0 overflow-hidden">
      <div role="region" aria-label="Bulk import history records" tabIndex={0}
        className="min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [mask-image:linear-gradient(to_bottom,black_92%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] print:overflow-visible print:[mask-image:none]">
        <DataTable caption="Bulk import history records"
          rows={runs.map((run,index)=>({...run,index}))}
          getRowKey={run=>String(run.index)}
          empty={<p role="status" className="text-sm text-body">No bulk imports on file for this college.</p>}
          columns={[
            {key:"when",header:"When",mobilePriority:"primary",cell:run=>run.when},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:run=>run.students},
            {key:"created",header:"Created",mobilePriority:"secondary",cell:run=>run.created},
            {key:"failed",header:"Failed",mobilePriority:"secondary",cell:run=>run.failed},
          ]} />
      </div>
    </Dialog>
  </>;
}
