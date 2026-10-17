type MetricRow={label:string;value:number;detail?:string};
/** Accessible read-only bar chart. Incoming values must be measured, never placeholders. */
export function ReportBarChart({title,rows,units="items",limit=20}:{
 title:string;rows:readonly MetricRow[];units?:string;limit?:number;
}){
 const normalized=[...rows].filter(r=>Number.isFinite(r.value)&&r.value>=0)
  .sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
 const shown=normalized.slice(0,limit);
 const maximum=Math.max(1,...shown.map(row=>row.value));
 return <figure className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <figcaption className="text-base font-semibold text-foreground">{title}</figcaption>
  {shown.length?<ol className="space-y-3">{shown.map((row,index)=><li key={row.label+index}>
   <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
    <span className="min-w-0 break-words font-semibold">{row.label}</span>
    <span className="shrink-0 tabular-nums">{row.value.toLocaleString("en-IN")} {units}</span>
   </div>
   <div className="h-2 overflow-hidden rounded-full bg-muted" role="img"
    aria-label={row.label+": "+row.value+" "+units}>
    <div className="h-full rounded-full bg-primary" style={{width:(row.value/maximum*100).toFixed(2)+"%"}}/>
   </div>
   {row.detail?<p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>:null}
  </li>)}</ol>:<p className="text-sm text-muted-foreground">No measured values are available for this chart.</p>}
  {normalized.length>shown.length?<p className="text-xs text-muted-foreground">
   Showing {shown.length} of {normalized.length} groups. Use the table for the remaining groups.
  </p>:null}
 </figure>;
}
