import { MetricBar } from "@/components/ui/metric-bar";
import styles from "./report-bar-chart.module.css";

type MetricRow={label:string;value:number;detail?:string};
/** Accessible read-only bar chart. Incoming values must be measured, never placeholders. */
export function ReportBarChart({title,rows,units="items",limit=20}:{
 title:string;rows:readonly MetricRow[];units?:string;limit?:number;
}){
 const normalized=[...rows].filter(r=>Number.isFinite(r.value)&&r.value>=0)
  .sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
 const shown=normalized.slice(0,limit);
 const maximum=Math.max(1,...shown.map(row=>row.value));
 return <figure className={"space-y-3 border-b pb-5 "+styles["figure"]}>
  <figcaption className={styles["title"]}>{title}</figcaption>
  {shown.length?<ol className="space-y-2">{shown.map((row,index)=><li key={row.label+index}>
   <div className={styles["chartRow"]}>
    <span className={styles["label"]} title={row.label}>{row.label}</span>
    <MetricBar label={row.label} value={row.value} maximum={maximum} unit={units}
      className={styles["track"]}/>
    <span className={styles["value"]} title={row.value.toLocaleString("en-IN")+" "+units}>
      {row.value.toLocaleString("en-IN")} {units}
    </span>
   </div>
   {row.detail?<p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>:null}
  </li>)}</ol>:<p className="text-sm text-muted-foreground">No measured values are available for this chart.</p>}
  {normalized.length>shown.length?<p className="text-xs text-muted-foreground">
   Showing {shown.length} of {normalized.length} groups. Use the table for the remaining groups.
  </p>:null}
 </figure>;
}
