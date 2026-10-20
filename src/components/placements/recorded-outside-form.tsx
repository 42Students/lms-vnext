import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function RecordedOutsideForm({collegeId,choices}:{
 collegeId:string;choices:readonly {id:string;name:string}[];
}){
 return <form method="post" action="/api/placements/recorded-outside" className="grid gap-4 min-[768px]:grid-cols-2">
  <Input type="hidden" name="collegeId" value={collegeId}/>
  <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Company relationship
   <Select name="companyRelationshipId" required defaultValue="" className="w-full">
    <option value="" disabled>Choose an authorized company</option>
    {choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </Select>
  </label>
  <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">External drive title
   <Input name="title" required minLength={3} maxLength={200} className="w-full"/>
  </label>
  <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">When it happened (IST)
   <Input name="occurredAt" required type="datetime-local" className="w-full"/>
  </label>
  <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">External reference (optional HTTPS)
   <Input name="externalReferenceUrl" type="url" maxLength={2000} placeholder="https://..." className="w-full"/>
  </label>
  <label className="grid gap-1 text-sm text-body min-[768px]:col-span-2">Private staff notes, no learner details
   <Textarea name="notes" maxLength={1000} rows={3} className="w-full"/>
  </label>
  <Button variant="primary" type="submit" disabled={!choices.length} className="min-[768px]:col-span-2">
   Record outside-platform drive
  </Button>
  <p className="text-xs text-muted-foreground min-[768px]:col-span-2">
   This is a historical staff record, not a published student job, application, offer, or invitation.
  </p>
 </form>;
}
