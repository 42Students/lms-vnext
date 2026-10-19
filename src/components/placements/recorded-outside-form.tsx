export function RecordedOutsideForm({collegeId,choices}:{
 collegeId:string;choices:readonly {id:string;name:string}[];
}){
 return <form method="post" action="/api/placements/recorded-outside" className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
  <input type="hidden" name="collegeId" value={collegeId}/>
  <label className="grid gap-1 text-sm text-body">Company relationship
   <select name="companyRelationshipId" required defaultValue="" className="min-h-11 rounded-[9px] border border-border bg-surface px-3">
    <option value="" disabled>Choose an authorized company</option>
    {choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm text-body">External drive title
   <input name="title" required minLength={3} maxLength={200} className="min-h-11 rounded-[9px] border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body">When it happened (IST)
   <input name="occurredAt" required type="datetime-local" className="min-h-11 rounded-[9px] border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body">External reference (optional HTTPS)
   <input name="externalReferenceUrl" type="url" maxLength={2000} placeholder="https://..." className="min-h-11 rounded-[9px] border border-border bg-surface px-3"/>
  </label>
  <label className="grid gap-1 text-sm text-body sm:col-span-2">Private staff notes, no learner details
   <textarea name="notes" maxLength={1000} rows={3} className="rounded-[9px] border border-border bg-surface p-3"/>
  </label>
  <button type="submit" disabled={!choices.length} className="min-h-11 rounded-[9px] bg-primary px-4 font-semibold text-on-primary disabled:opacity-50 sm:col-span-2">
   Record outside-platform drive
  </button>
  <p className="text-xs text-muted-foreground sm:col-span-2">
   This is a historical staff record, not a published student job, application, offer, or invitation.
  </p>
 </form>;
}
