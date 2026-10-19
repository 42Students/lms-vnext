import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function RecordedOutsideForm({collegeId,choices}:{
 collegeId:string;choices:readonly {id:string;name:string}[];
}){
 return <form method="post" action="/api/placements/recorded-outside" className="grid gap-4 sm:grid-cols-2">
  <input type="hidden" name="collegeId" value={collegeId}/>
  <label className="grid gap-1 text-sm text-body">Company relationship
   <Select name="companyRelationshipId" required defaultValue="" className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    <option value="" disabled>Choose an authorized company</option>
    {choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </Select>
  </label>
  <label className="grid gap-1 text-sm text-body">External drive title
   <Input name="title" required minLength={3} maxLength={200} className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"/>
  </label>
  <label className="grid gap-1 text-sm text-body">When it happened (IST)
   <Input name="occurredAt" required type="datetime-local" className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"/>
  </label>
  <label className="grid gap-1 text-sm text-body">External reference (optional HTTPS)
   <Input name="externalReferenceUrl" type="url" maxLength={2000} placeholder="https://..." className="min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"/>
  </label>
  <label className="grid gap-1 text-sm text-body sm:col-span-2">Private staff notes, no learner details
   <Textarea name="notes" maxLength={1000} rows={3} className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"/>
  </label>
  <Button variant="primary" type="submit" disabled={!choices.length} className="min-h-9 px-4 sm:col-span-2">
   Record outside-platform drive
  </Button>
  <p className="text-xs text-muted-foreground sm:col-span-2">
   This is a historical staff record, not a published student job, application, offer, or invitation.
  </p>
 </form>;
}
