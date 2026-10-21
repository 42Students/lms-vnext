"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CollegeRecurringPreview } from "@/components/academics/college-recurring-preview";

type Options = {
  classes: { id: string; name: string; cohortName: string; periodStart: string; periodEnd: string; updatedAt: string }[];
  halls: { id: string; name: string }[];
  faculty: { id: string; displayName: string | null }[];
  deliveries: { id: string; sectionId: string; name: string; code: string }[];
  errors?: { classes: boolean; halls: boolean; faculty: boolean; deliveries: boolean };
};

/** Legacy class editor opened recurring scheduling without losing the list. */
export function CollegeRecurringEntry({ options }: { options: Options }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="secondary" type="button" onClick={() => setOpen(true)}>
      Recurring sessions
    </Button>
    <Dialog open={open} onOpenChange={setOpen} title="Recurring class sessions"
      className="max-w-[720px]" bodyClassName="max-h-[70dvh]">
      <CollegeRecurringPreview {...options} onCancel={()=>setOpen(false)} />
    </Dialog>
  </>;
}
