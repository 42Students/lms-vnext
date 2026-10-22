import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function RecordedOutsideForm({collegeId,choices}:{
 collegeId:string;choices:readonly {id:string;name:string}[];
}){
 return <form method="post" action="/api/placements/recorded-outside" className="grid min-w-0 gap-4 md:grid-cols-2">
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
  <details className="min-w-0 border-t border-border pt-2 md:col-span-2">
   <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Optional reference and notes</summary>
   <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2">
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">External reference (optional HTTPS)
   <Input name="externalReferenceUrl" type="url" maxLength={2000} placeholder="https://..." className="w-full"/>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Private staff notes, no learner details
   <Textarea name="notes" maxLength={1000} rows={3} className="w-full"/>
  </label>

   </div>
  </details>
  <Button variant="primary" type="submit" disabled={!choices.length} className="min-h-11 w-full justify-self-stretch md:col-span-2 md:min-h-9 md:w-auto md:justify-self-start">
   Record outside-platform drive
  </Button>
  <p className="min-w-0 text-xs text-muted-foreground md:col-span-2 leading-5">
   This is a historical staff record, not a published student job, application, offer, or invitation. No student is told when you record it.
  </p>
 </form>;
}
