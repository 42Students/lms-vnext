"use client";
import { Checkbox } from "@/components/ui/checkbox";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type Choices={notifyMatchingJobs:boolean;notifyApplicationUpdates:boolean};

export function LearnerPlacementNotificationSettings({initial}:{
  initial:Choices;
}) {
  const router=useRouter();
  const {showToast}=useToast();
  const [matching,setMatching]=useState(initial.notifyMatchingJobs);
  const [updates,setUpdates]=useState(initial.notifyApplicationUpdates);
  const [confirm,setConfirm]=useState(false);
  const [pending,setPending]=useState(false);
  const changed=matching!==initial.notifyMatchingJobs ||
    updates!==initial.notifyApplicationUpdates;

  async function save(){
    if(pending || !changed) return;
    setPending(true);
    try {
      const response=await fetch("/api/placements/preferences/notifications",{
        method:"PUT",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          notifyMatchingJobs:matching,
          notifyApplicationUpdates:updates,
          confirmed:true,
          expected:initial,
        }),
      });
      const result=await response.json().catch(()=>null) as {error?:string}|null;
      if(!response.ok) throw new Error(result?.error === "PLACEMENT_NOTIFICATION_PREFERENCES_STALE"
        ? "Your saved choices changed in another tab. Reload saved choices before trying again."
        : result?.error??"Preference update failed");
      setConfirm(false);
      showToast({tone:"success",title:"Placement notification choices saved",
        description:"Only your placement notification choices were updated."});
      router.refresh();
    }catch(error){
      showToast({tone:"error",title:"Could not save notification choices",
        description:error instanceof Error?error.message:"Please try again."});
    }finally{
      setPending(false);
    }
  }

  return <section aria-labelledby="placement-notification-title"
    className="border-b border-border pb-5">
    <h2 id="placement-notification-title" className="text-lg font-semibold text-foreground">
      Placement notification choices
    </h2>
    <p className="mt-2 text-sm leading-6 text-body">
      These choices apply only to placement opportunity matching and application
      updates. Essential college, academic and security messages are not controlled here.
    </p>
    <div className="mt-5 grid gap-4">
      <label className="flex min-h-12 items-start gap-3 rounded-[var(--lms-control-radius)] border border-border p-4">
        <Checkbox checked={matching} onChange={e=>setMatching(e.target.checked)}
          disabled={pending} className="mt-1" />
        <span><span className="block font-semibold text-foreground">Matching opportunities</span>
          <span className="mt-1 block text-sm text-body">
            Choose whether to receive matching placement-job notifications.
          </span></span>
      </label>
      <label className="flex min-h-12 items-start gap-3 rounded-[var(--lms-control-radius)] border border-border p-4">
        <Checkbox checked={updates} onChange={e=>setUpdates(e.target.checked)}
          disabled={pending} className="mt-1" />
        <span><span className="block font-semibold text-foreground">Application updates</span>
          <span className="mt-1 block text-sm text-body">
            Choose whether to receive application-stage notifications.
          </span></span>
      </label>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <Button disabled={!changed || pending} onClick={()=>setConfirm(true)}>
        Review changes
      </Button>
      <Button variant="secondary" disabled={pending} onClick={()=>router.refresh()}>Reload saved choices</Button>
      {changed ? <span className="text-xs text-body">Unsaved changes</span>
        : <span className="text-xs text-muted-foreground">No changes to save</span>}
    </div>
    <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open)}}
      title="Confirm placement notification choices"
      description="Only the two placement notification preferences will change. Other placement preferences remain intact."
      footer={<div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Keep current choices</Button>
        <Button disabled={pending || !changed} onClick={()=>void save()}>
          {pending?"Saving…":"Confirm and save"}
        </Button>
      </div>}>
      <p className="text-sm leading-6 text-body">
        Matching opportunities: {matching?"On":"Off"}.
        Application updates: {updates?"On":"Off"}.
      </p>
    </Dialog>
  </section>;
}
