"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { learnerApplicationWithdrawalSchema } from "@/modules/placements/learner-withdrawal-model";

export function LearnerApplicationDetailWithdraw({applicationId}:{applicationId:string}) {
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function submit() {
    if(pending)return;
    const parsed=learnerApplicationWithdrawalSchema.safeParse({
      action:"WITHDRAW",confirmed:true,reason,
    });
    if(!parsed.success) {setError(parsed.error.issues[0]?.message??"Enter a withdrawal reason.");return;}
    setPending(true);setError(null);
    try{
      const result=await fetch("/api/placements/applications/"+encodeURIComponent(applicationId)+"/actions",{
        method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(parsed.data),
      });
      if(!result.ok)throw new Error("Application withdrawal was not recorded. Your status is unchanged.");
      setOpen(false);setReason("");router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Withdrawal failed.");}
    finally{setPending(false);}
  }
  return <>
    <Button variant="secondary" onClick={()=>{setError(null);setOpen(true);}}>Withdraw application</Button>
    <Dialog open={open} onOpenChange={next=>{if(!next&&!pending)setOpen(false);}}
      title="Confirm application withdrawal"
      description="The existing placement service checks your membership and current application state again before recording withdrawal."
      footer={<>
        <Button variant="secondary" disabled={pending} onClick={()=>setOpen(false)}>Keep application</Button>
        <Button disabled={pending} onClick={()=>void submit()}>{pending?"Saving…":"Confirm withdrawal"}</Button>
      </>}>
      <label htmlFor="own-application-withdraw-reason" className="block text-sm font-semibold text-foreground">
        Reason for withdrawal
      </label>
      <textarea id="own-application-withdraw-reason" rows={4} maxLength={2000}
        value={reason} onChange={event=>setReason(event.target.value)}
        className="mt-2 min-h-28 w-full rounded-md border border-border bg-surface p-3 text-sm text-foreground"
        placeholder="Explain why you are withdrawing this application."/>
      {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
    </Dialog>
  </>;
}
