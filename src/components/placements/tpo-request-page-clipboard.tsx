"use client";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {useState} from "react";
import {DataTable} from "@/components/ui/data-table";
export type TpoRequestClipboardRow={id:string;student:string;number:string|null;
 kind:string;company:string;asked:string;status:string;decided:string|null};
export type TpoRequestClipboardColumn=Exclude<keyof TpoRequestClipboardRow,"id">;
const clipboardLabels:Record<TpoRequestClipboardColumn,string>={
 student:"Student",number:"Student number",kind:"Request",company:"Company",
 asked:"Asked",status:"Status",decided:"Decided",
};
const allClipboardColumns=Object.keys(clipboardLabels) as TpoRequestClipboardColumn[];
/** Copy only columns the operator chose to display; never include hidden fields. */
export function requestRowsTsv(
 rows:readonly TpoRequestClipboardRow[],
 columns:readonly TpoRequestClipboardColumn[]=allClipboardColumns,
):string{
 const selected=allClipboardColumns.filter(column=>columns.includes(column));
 if(selected.length===0)throw new Error("At least one request column must be selected");
 const neutral=(v:string|null)=>{
  const value=(v??"").replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu," ").trim();
  return /^[\p{Cc}\p{Cf}\p{M}\p{Zs}\p{Zl}\p{Zp}]*[=+@-]/u.test(value)
   ?"'"+value:value;
 };
 return [selected.map(column=>clipboardLabels[column]),...rows.map(row=>selected.map(column=>row[column]))]
  .map(cells=>cells.map(neutral).join("\t")).join("\n");
}
export type TpoRequestClipboardSort="ASKED_NEW"|"ASKED_OLD"|"DECIDED_NEW"|"DECIDED_OLD";
/** Stable, immutable visible-page sorting; no hidden or previous-page rows. */
export function sortRequestClipboardRows(
 rows:readonly TpoRequestClipboardRow[],
 sort:TpoRequestClipboardSort,
):TpoRequestClipboardRow[]{
 const key=sort.startsWith("ASKED")?"asked":"decided";
 const direction=sort.endsWith("OLD")?1:-1;
 return [...rows].sort((left,right)=>{
  const a=left[key],b=right[key];
  if(a===null&&b!==null)return 1;
  if(b===null&&a!==null)return -1;
  return direction*(a??"").localeCompare(b??"") || left.id.localeCompare(right.id);
 });
}
export function selectedRequestClipboardRows(
 rows:readonly TpoRequestClipboardRow[],
 ids:readonly string[],
 sort:TpoRequestClipboardSort,
):TpoRequestClipboardRow[]{
 const selected=new Set(ids);
 return sortRequestClipboardRows(rows,sort).filter(row=>selected.has(row.id));
}
export function TpoRequestPageClipboard({rows}:{rows:readonly TpoRequestClipboardRow[]}){
 const [selected,setSelected]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const [sort,setSort]=useState<TpoRequestClipboardSort>("ASKED_NEW");
 const [visible,setVisible]=useState<readonly string[]>(["student","number","kind","company","asked","status","decided"]);
 const options=[{key:"student",label:"Student"},{key:"number",label:"Student number"},
  {key:"kind",label:"Request"},{key:"company",label:"Company"},{key:"asked",label:"Asked"},
  {key:"status",label:"Status"},{key:"decided",label:"Decided on"}] as const;
 const columns=options.filter(x=>visible.includes(x.key));
 const sorted=sortRequestClipboardRows(rows,sort);
 const selectedRows=sortRequestClipboardRows(rows.filter(row=>selected.includes(row.id)),sort);
 async function copy(){
  try{
   await navigator.clipboard.writeText(requestRowsTsv(selectedRows,visible as readonly TpoRequestClipboardColumn[]));
   setNotice("Copied "+selectedRows.length+" selected requests.");
  }catch{setNotice("Could not copy. Check your browser clipboard permissions.");}
 }
 return <section aria-label="Request row tools" className="space-y-2 rounded-lg border border-border p-3">
  <p className="text-sm font-semibold">Select and copy request rows</p>
  <p role="status" aria-live="polite" className="text-xs">{selectedRows.length} selected of {rows.length} on this page.</p>
  <div className="flex flex-wrap gap-3">
   <label className="text-sm">Sort request rows
    <Select className="ml-2 min-h-11 max-w-full rounded-[9px] border border-border bg-surface p-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" value={sort}
     onChange={e=>setSort(e.target.value as typeof sort)}>
     <option value="ASKED_NEW">Asked · newest</option><option value="ASKED_OLD">Asked · oldest</option>
     <option value="DECIDED_NEW">Decided on · newest</option><option value="DECIDED_OLD">Decided on · oldest</option>
    </Select>
   </label>
   <details className="min-w-0 max-w-full rounded border border-border p-2 text-sm">
    <summary className="inline-flex min-h-11 cursor-pointer items-center rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Choose columns</summary>
    <div className="mt-2 flex flex-wrap gap-3">{options.map(option=><label key={option.key} className="flex min-h-11 items-center gap-2">
      <Checkbox checked={visible.includes(option.key)}
       disabled={visible.length===1&&visible.includes(option.key)}
       onChange={e=>setVisible(keys=>e.target.checked?[...keys,option.key]:keys.filter(key=>key!==option.key))}/>
      {option.label}
    </label>)}</div>
    <button type="button" className="mt-2 min-h-11 rounded-[9px] border border-border px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" onClick={()=>setVisible(options.map(option=>option.key))}>Reset columns</button>
   </details>
  </div>
  <DataTable<TpoRequestClipboardRow>
   caption="Request spreadsheet"
   rows={sorted}
   getRowKey={row=>row.id}
   empty={<p role="status" className="text-sm text-body">No requests on this page.</p>}
   columns={[
    {key:"selection",header:<Checkbox
      aria-label="Select all request rows"
      checked={rows.length>0&&selectedRows.length===rows.length}
      onChange={event=>setSelected(event.target.checked?rows.map(row=>row.id):[])}/>,
     mobilePriority:"action" as const,
     cell:row=><label className="inline-flex min-h-11 items-center gap-2">
      <Checkbox checked={selected.includes(row.id)}
       aria-label={"Select request from "+row.student}
       onChange={event=>setSelected(ids=>event.target.checked
        ?[...new Set([...ids,row.id])]:ids.filter(id=>id!==row.id))}/>
      <span className="text-xs text-body sm:hidden">Select request</span>
     </label>},
    ...columns.map((column,index)=>({
     key:column.key,
     header:column.label,
     mobileLabel:column.label,
     mobilePriority:index===0?"primary" as const:"secondary" as const,
     className:index===0?"sm:sticky sm:left-10 sm:z-10 sm:bg-surface":"",
     cell:(row:TpoRequestClipboardRow)=>row[column.key]??"—",
    })),
   ]}
  />
  <label className="flex min-h-11 items-center gap-2 text-sm">
   <Checkbox checked={rows.length>0&&selectedRows.length===rows.length}
    onChange={event=>setSelected(event.target.checked?rows.map(row=>row.id):[])}/>
   Select visible page
  </label>
  <button type="button" disabled={selectedRows.length===0} onClick={()=>void copy()}
   className="min-h-11 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">Copy selected rows</button>
  {notice?<p role="status" className="text-sm">{notice}</p>:null}
 </section>;
}
