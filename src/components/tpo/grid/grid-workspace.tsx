"use client";

import {useEffect,useId,useMemo,useState,type ReactNode} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
import {TpoGridFilterPanel,type TpoFilterField} from "@/components/tpo/tpo-grid-filter-panel";
import {chosenTpoGridColumns,exportTpoGridCsv,parseTpoGridColumns,updateTpoGridQuery,type TpoGridColumn} from "@/modules/placements/tpo-grid-model";

type Selection={selected:readonly string[];onChange:(ids:string[])=>void};
type GridWorkspaceProps<Row>={
 rows:readonly Row[];
 columns:readonly TpoGridColumn<Row>[];
 rowKey:(row:Row)=>string;
 children:ReactNode;
 filters?:readonly TpoFilterField[];
 selection?:Selection;
 rollOf?:(row:Row)=>string|null|undefined;
 savedViews?:ReactNode;
 extraActions?:ReactNode;
 exportName?:string;
 xlsxHref?:string|null;
 searchPlaceholder?:string;
 searchParam?:string;
 filterTitle?:string;
};

const safeTsv=(value:unknown)=>{
 const cell=String(value??"").replace(/[\t\r\n]+/g," ");
 return /^[\s\u0000-\u001f]*[=+@-]/u.test(cell)?"'"+cell:cell;
};

/** Legacy TPO list chrome. Accepts only the authorized rows supplied by the page:
 * search persists in its URL, and copy/paste/export never fetch broader datasets. */
export function GridWorkspace<Row>({
 rows,columns,rowKey,children,filters=[],selection,rollOf,savedViews,extraActions,
 exportName="tpo-grid",xlsxHref,searchPlaceholder="Search name, roll no., anything",
 searchParam="search",filterTitle="Filters",
}:GridWorkspaceProps<Row>){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const id=useId();
 const querySearch=params.get(searchParam)??"";
 const [typed,setTyped]=useState(querySearch);
 const [filterOpen,setFilterOpen]=useState(false);
 const [columnsOpen,setColumnsOpen]=useState(false);
 const [viewsOpen,setViewsOpen]=useState(false);
 const [exportOpen,setExportOpen]=useState(false);
 const [pasteOpen,setPasteOpen]=useState(false);
 const [pasteText,setPasteText]=useState("");
 const [notice,setNotice]=useState("");
 const permitted=useMemo(()=>columns.filter(column=>!column.exportOnly).map(column=>column.key),[columns]);
 const activeKeys=parseTpoGridColumns(params.get("columns")??undefined,permitted);
 const chosen=chosenTpoGridColumns(columns,activeKeys.length?activeKeys:permitted)
   .filter(column=>!column.exportOnly);
 const pageIds=useMemo(()=>new Set(rows.map(rowKey)),[rows,rowKey]);
 const selectedPage=rows.filter(row=>selection?.selected.includes(rowKey(row)));
 const exportedRows=selectedPage.length?selectedPage:rows;
 const activeFilters=filters.filter(field=>{
  const raw=params.get(field.urlKey??"filter."+field.key);
  return raw!==null&&raw!==""&&raw!==(field.allValue??"");
 });
 const searchKey=params.toString();
 useEffect(()=>{setTyped(querySearch);},[querySearch]);
 useEffect(()=>{
  if(typed.trim()===querySearch)return;
  const timer=window.setTimeout(()=>{
   const next=updateTpoGridQuery(new URLSearchParams(searchKey),{[searchParam]:typed.trim()});
   router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
  },200);
  return ()=>window.clearTimeout(timer);
 },[typed,querySearch,searchKey,pathname,router,searchParam]);
 const changeColumns=(keys:string[])=>{
  const reset=keys.length===permitted.length&&keys.every((key,index)=>key===permitted[index]);
  const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{columns:reset?"":keys.join(",")},false);
  router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
 };
 const downloadCsv=()=>{
  if(!rows.length){setNotice("There are no rows on this page to export.");return;}
  try{
   const csv=exportTpoGridCsv(chosen,exportedRows);
   const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
   try{
    const link=document.createElement("a");
    link.href=url;link.download=exportName.replace(/[^a-z0-9_-]/gi,"-")+".csv";
    document.body.appendChild(link);link.click();link.remove();
   }finally{URL.revokeObjectURL(url);}
   setNotice("Exported "+exportedRows.length+" authorized row(s) from this page.");
  }catch{setNotice("Could not prepare the CSV. Please try again.");}
 };
 const copyRows=async()=>{
  const lines=[chosen.map(column=>safeTsv(column.label)).join("\t"),
   ...exportedRows.map(row=>chosen.map(column=>safeTsv(column.read(row))).join("\t"))];
  try{await navigator.clipboard.writeText(lines.join("\r\n"));
   setNotice("Copied "+exportedRows.length+" row(s) as tab-separated columns.");
  }catch{setNotice("Clipboard access is blocked. Use CSV export instead.");}
 };
 const selectRolls=()=>{
  if(!selection||!rollOf)return;
  const tokens=[...new Set(pasteText.split(/[\s,;]+/).map(part=>part.trim().toLowerCase()).filter(Boolean))];
  if(tokens.length>500){setNotice("Paste at most 500 roll numbers at a time.");return;}
  const lookup=new Map<string,string|null>();
  for(const row of rows){
   const key=String(rollOf(row)??"").trim().toLowerCase();
   if(!key)continue;
   const id=rowKey(row);
   if(lookup.has(key)&&lookup.get(key)!==id)lookup.set(key,null);
   else if(!lookup.has(key))lookup.set(key,id);
  }
  const matches=tokens.map(token=>lookup.get(token));
  const chosen=matches.filter((value):value is string=>typeof value==="string");
  const unmatched=tokens.filter(token=>!lookup.get(token));
  const outside=selection.selected.filter(key=>!pageIds.has(key));
  selection.onChange([...new Set([...outside,...chosen])]);
  setNotice("Matched "+chosen.length+" of "+tokens.length+" roll number(s) on this authorized page."+
   (unmatched.length?" Unmatched or ambiguous: "+unmatched.slice(0,12).join(", "):""));
 };
 return <section className="min-w-0 space-y-3" aria-label="TPO grid workspace" data-tpo-grid-workspace>
  <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="TPO table tools">
   <div className="flex min-w-[190px] max-w-lg flex-1 items-center gap-2">
    <Input aria-label="Search table" value={typed} maxLength={200}
     placeholder={searchPlaceholder} onChange={event=>setTyped(event.target.value)}/>
    <Button variant="secondary" type="button" onClick={()=>{
     const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{[searchParam]:typed.trim()});
     router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
    }}><Image src="/assets/images/common/search.svg" alt="" aria-hidden="true" width={19} height={19}/>Search</Button>
   </div>
   {filters.length?<Button variant="secondary" type="button" aria-expanded={filterOpen}
    aria-controls={id+"-filters"} onClick={()=>setFilterOpen(value=>!value)}>
    Filters{activeFilters.length?" ("+activeFilters.length+")":""}
   </Button>:null}
   {savedViews?<Button variant="secondary" type="button" aria-expanded={viewsOpen}
    aria-controls={id+"-views"} onClick={()=>setViewsOpen(value=>!value)}>Views</Button>:null}
   <Button variant="secondary" type="button" aria-expanded={columnsOpen}
    aria-controls={id+"-columns"} onClick={()=>setColumnsOpen(value=>!value)}>Columns</Button>
   <Button variant="secondary" type="button" aria-expanded={exportOpen}
    aria-controls={id+"-export"} onClick={()=>setExportOpen(value=>!value)}>Export</Button>
   <Button variant="secondary" type="button" disabled={!rows.length}
    onClick={()=>void copyRows()}><Image src="/assets/images/common/file-black.svg" alt="" aria-hidden="true" width={16} height={16}/>Copy {selectedPage.length?"selected":"visible"} rows</Button>
   {selection&&rollOf?<Button variant="secondary" type="button" aria-expanded={pasteOpen}
    aria-controls={id+"-paste"} onClick={()=>setPasteOpen(value=>!value)}>Paste roll numbers</Button>:null}
   {extraActions}
  </div>
  {activeFilters.length?<div className="flex flex-wrap gap-2" aria-label="Active grid filters">
   {activeFilters.map(field=><Button variant="secondary" size="sm" key={field.key}
    className="rounded-full" type="button"
    aria-label={"Remove "+field.label+" filter"}
    onClick={()=>{
     const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{
      [field.urlKey??"filter."+field.key]:""
     });router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
    }}>
    {field.label}: {field.options.find(opt=>opt.value===params.get(field.urlKey??"filter."+field.key))?.label??"Unknown"} ×
   </Button>)}
  </div>:null}
  {filterOpen&&filters.length?<div id={id+"-filters"}>
   <TpoGridFilterPanel fields={filters} title={filterTitle} mobileSheet/>
  </div>:null}
  {viewsOpen&&savedViews?<div id={id+"-views"}>{savedViews}</div>:null}
  {columnsOpen?<div id={id+"-columns"}>
   <TpoGridColumnChooser columns={columns} selected={activeKeys.length?activeKeys:permitted} onChange={changeColumns}/>
  </div>:null}
  {exportOpen?<div id={id+"-export"} className="flex flex-wrap items-center gap-2">
   <Button variant="secondary" type="button" onClick={downloadCsv}
    disabled={!rows.length}>Export {selectedPage.length?"selected":"visible"} CSV</Button>
   {xlsxHref?<a href={xlsxHref} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-link lms-inline-link">Export selected XLSX</a>:null}
   <span className="text-xs text-muted-foreground">Exports contain only rows on this page{selectedPage.length?" that are selected":""}; server-side Excel uses existing permissions.</span>
  </div>:null}
  {pasteOpen&&selection&&rollOf?<div id={id+"-paste"} className="space-y-2">
   <label className="block text-sm font-semibold">Roll numbers (one per line, space or comma separated)
    <Textarea className="mt-1" value={pasteText} maxLength={15000} rows={3}
     onChange={event=>setPasteText(event.target.value)}/>
   </label>
   <Button variant="secondary" type="button" disabled={!pasteText.trim()} onClick={selectRolls}>
    Select matching students on this page
   </Button>
  </div>:null}
  <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-2 text-sm">
   <span role="status">{rows.length} items in this view{selection?" · "+selectedPage.length+" selected":""}</span>
   {selection?.selected.length?<Button variant="ghost" type="button" onClick={()=>selection.onChange(
     selection.selected.filter(key=>!pageIds.has(key))
   )}>Clear page selection</Button>:null}
  </div>
  {notice?<p role="status" className="text-xs text-muted-foreground">{notice}</p>:null}
  {children}
 </section>;
}
