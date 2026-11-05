import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
export function RecordedOutsideForm({collegeId,choices}:{
 collegeId:string;choices:readonly {id:string;name:string}[];
}){
 return <form method="post" action="/api/placements/recorded-outside" className="grid min-w-0 gap-4 md:grid-cols-2">
  <Input type="hidden" name="collegeId" value={collegeId}/>
  <Label stack className="min-w-0">Company relationship
   <Select name="companyRelationshipId" required defaultValue="" className="w-full">
    <option value="" disabled>Choose an authorized company</option>
    {choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </Select>
  </Label>
  <Label stack className="min-w-0">External drive title
   <Input name="title" required minLength={3} maxLength={200} className="w-full"/>
  </Label>
  <Label stack className="min-w-0">When it happened (IST)
   <Input name="occurredAt" required type="datetime-local" className="w-full"/>
  </Label>
  <Disclosure title="Optional reference and notes" className="min-w-0 md:col-span-2">
   <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-2">
  <Label stack className="min-w-0">External reference (optional HTTPS)
   <Input name="externalReferenceUrl" type="url" maxLength={2000} placeholder="https://..." className="w-full"/>
  </Label>
  <Label stack className="min-w-0 md:col-span-2">Private staff notes, no learner details
   <Textarea name="notes" maxLength={1000} rows={3} className="w-full"/>
  </Label>

   </div>
  </Disclosure>
  <Button variant="primary" type="submit" disabled={!choices.length} className="min-h-11 w-full justify-self-stretch md:col-span-2 md:min-h-9 md:w-auto md:justify-self-start">
   Record outside-platform drive
  </Button>
  <p className="min-w-0 text-xs text-muted-foreground md:col-span-2 leading-5">
   This is a historical staff record, not a published student job, application, offer, or invitation. No student is told when you record it.
  </p>
 </form>;
}
