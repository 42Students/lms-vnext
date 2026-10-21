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
    <Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto print:hidden" onClick={() => setOpen(true)}>
      Import History
    </Button>
    <Dialog open={open} onOpenChange={setOpen} title="Import History"
      className="max-w-[640px]" bodyClassName="min-w-0"
      footer={<Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Close</Button>}>
      <div role="region" aria-label="Bulk import history records"
        className="min-w-0">
        <DataTable caption="Bulk import history records"
          rows={runs.map((run,index)=>({...run,index}))}
          getRowKey={run=>String(run.index)}
          empty={<p role="status" className="text-sm text-body">No import history found.</p>}
          columns={[
            {key:"when",header:"Date",mobilePriority:"primary",cell:run=>run.when},
            {key:"students",header:"Rows",mobilePriority:"secondary",cell:run=>run.students},
            {key:"created",header:"Created",mobilePriority:"secondary",cell:run=>run.created},
            {key:"failed",header:"Failed",mobilePriority:"secondary",cell:run=>run.failed},
          ]} />
      </div>
      <p className="mt-3 max-w-prose text-xs leading-5 text-muted-foreground">
       The import history is an audit-event summary, not an undoable learner import batch.
       Created memberships retain their own UUIDs and activity history. There is no
       bulk rollback or legacy numeric batch ID; review individual memberships
       before any corrective action. Import steps are Validate, Create and Sample CSV,
       with an extra confirmation before applying valid rows.
      </p>
    </Dialog>
  </>;
}
