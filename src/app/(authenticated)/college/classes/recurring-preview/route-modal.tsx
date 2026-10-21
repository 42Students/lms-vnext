"use client";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { CollegeRecurringPreview } from "@/components/academics/college-recurring-preview";

/** Deep-linked row scheduling retains the legacy 720px modal geometry. */
export function CollegeRecurringRouteModal({options}:{
  options:Parameters<typeof CollegeRecurringPreview>[0];
}){
  const router=useRouter();
  const close=()=>router.replace("/college/classes");
  return <Dialog open={true} onOpenChange={next=>{if(!next)close();}}
    title="Recurring class sessions" dismissible={false} historyMode="route"
    className="max-w-[720px]" bodyClassName="max-h-[70dvh]">
    <CollegeRecurringPreview {...options} onCancel={close} />
  </Dialog>;
}
