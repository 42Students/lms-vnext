import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function RecordedOutsideForm({collegeId,choices}:{
 collegeId:string;choices:readonly {id:string;name:string}[];
}){
 return <form method="post" action="/api/placements/recorded-outside" className="grid min-w-0 gap-3 min-[768px]:grid-cols-2">
  <Input type="hidden" name="collegeId" value={collegeId}/>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company relationship
   <Select name="companyRelationshipId" required defaultValue="" className="w-full">
    <option value="" disabled>Choose an authorized company</option>
    {choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </Select>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">External drive title
   <Input name="title" required minLength={3} maxLength={200} className="w-full"/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">When it happened (IST)
   <Input name="occurredAt" required type="datetime-local" className="w-full"/>
  </label>
  <details className="min-w-0 min-[768px]:col-span-2"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text min-[768px]:min-h-9">External reference (optional HTTPS)</summary><div className="mt-3 grid min-w-0 gap-3 min-[768px]:grid-cols-2">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">External reference (optional HTTPS)
   <Input name="externalReferenceUrl" type="url" maxLength={2000} placeholder="https://..." className="w-full"/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Private staff notes, no learner details
   <Textarea name="notes" maxLength={1000} rows={3} className="w-full"/>
  </label>
  </div></details>
  <Button variant="primary" type="submit" disabled={!choices.length} className="min-h-11 w-full justify-self-stretch min-[768px]:min-h-9 min-[768px]:col-span-2 min-[768px]:w-auto min-[768px]:justify-self-start">
   Record outside-platform drive
  </Button>
  <p className="min-w-0 max-w-2xl text-xs text-muted-foreground min-[768px]:col-span-2">
   This is a historical staff record, not a published student job, application, offer, or invitation.
  </p>
 </form>;
}
