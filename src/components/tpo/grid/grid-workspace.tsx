"use client";

import {useEffect,useId,useMemo,useState,type ReactNode} from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {FilterChip} from "@/components/ui/filter-chip";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {InlineNotice} from "@/components/ui/inline-notice";
import {TpoGridColumnChooser} from "@/components/tpo/tpo-grid-column-chooser";
import {TpoGridFilterPanel,type TpoFilterField} from "@/components/tpo/tpo-grid-filter-panel";
import {chosenTpoGridColumns,exportTpoGridCsv,tpoGridExportColumns,parseTpoGridColumns,updateTpoGridQuery,type TpoGridColumn} from "@/modules/placements/tpo-grid-model";
import {legacyGridExportFilename} from "@/modules/placements/grid-export-filename";
import {gridClipboardTsv} from "./grid-export";

type Selection={selected:readonly string[];onChange:(ids:string[])=>void};
type GridWorkspaceProps<Row>={
 rows:readonly Row[];
 columns:readonly TpoGridColumn<Row>[];
 rowKey:(row:Row)=>string;
 children:ReactNode|((visibleKeys:readonly string[])=>ReactNode);
 columnScope?:"url"|"local";
 columnStorageKey?:string;
 columnKeys?:readonly string[];
 defaultVisibleKeys?:readonly string[];
 onColumnKeysChange?:(keys:string[])=>void;
 filters?:readonly TpoFilterField[];
 externalFilters?:{count:number;open:boolean;controlsId:string;onToggle:()=>void};
 selection?:Selection;
 rollOf?:(row:Row)=>string|readonly string[]|null|undefined;
 savedViews?:ReactNode;
 extraActions?:ReactNode;
 act?:(shown:readonly Row[],selected:readonly Row[],clear:()=>void)=>ReactNode;
 exportName?:string;
 xlsxHref?:string|null;
 onExportCsv?:(selected:boolean)=>void;
 onExportXlsx?:(selected:boolean)=>void;
 onCopyRows?:()=>void;
 searchPlaceholder?:string;
 searchParam?:string;
 filterTitle?:string;
 searchMaxLength?:number;
 searchMode?:"url"|"controlled"|"hidden";
 searchValue?:string;
 onSearchChange?:(next:string)=>void;
};


/** Legacy TPO list chrome. Accepts only the authorized rows supplied by the page:
 * search persists in its URL, and copy/paste/export never fetch broader datasets. */
export function GridWorkspace<Row>({
 rows,columns,rowKey,children,filters=[],externalFilters,selection,rollOf,savedViews,extraActions,act,
 exportName="export",xlsxHref,searchPlaceholder="Search name, roll no., anything",
 searchParam="search",filterTitle="Filters",columnScope="url",columnStorageKey,
 searchMaxLength=120,searchMode="url",searchValue,onSearchChange,
 columnKeys,onColumnKeysChange,onExportCsv,onExportXlsx,onCopyRows,defaultVisibleKeys,
}:GridWorkspaceProps<Row>){
 const router=useRouter(),pathname=usePathname(),params=useSearchParams();
 const id=useId();
 const querySearch=searchMode==="controlled"?(searchValue??""):
  searchMode==="hidden"?"":params.get(searchParam)??"";
 const [typed,setTyped]=useState(querySearch);
 const [filterOpen,setFilterOpen]=useState(false);
 const [columnsOpen,setColumnsOpen]=useState(false);
 const [viewsOpen,setViewsOpen]=useState(false);
 const [exportOpen,setExportOpen]=useState(false);
 const [pasteOpen,setPasteOpen]=useState(false);
 const [pasteText,setPasteText]=useState("");
 const [notice,setNotice]=useState("");
 const [localKeys,setLocalKeys]=useState<string[]>([]);
 const permitted=useMemo(()=>columns.filter(column=>!column.exportOnly).map(column=>column.key),[columns]);
 const keySignature=permitted.join(",");
 useEffect(()=>{
  if(columnScope!=="local"||!columnStorageKey)return;
  try{const raw=window.localStorage.getItem(columnStorageKey);
   if(raw)setLocalKeys(parseTpoGridColumns(raw,permitted));
  }catch{/* Local storage is optional; default columns remain available. */}
 },[columnScope,columnStorageKey,keySignature]);
 const urlKeys=parseTpoGridColumns(params.get("columns")??undefined,permitted);
 const controlledKeys=columnKeys?columnKeys.filter(key=>permitted.includes(key)):null;
 const activeKeys=controlledKeys?.length?controlledKeys:
  columnScope==="local"&&localKeys.length?localKeys:
  urlKeys.length&&columnScope==="url"?urlKeys:
  defaultVisibleKeys?.filter(key=>permitted.includes(key))??permitted;
 const chosen=chosenTpoGridColumns(columns,activeKeys.length?activeKeys:permitted)
   .filter(column=>!column.exportOnly);
 const exportColumns=tpoGridExportColumns(columns,chosen);
 const pageIds=useMemo(()=>new Set(rows.map(rowKey)),[rows,rowKey]);
 const selectedPage=rows.filter(row=>selection?.selected.includes(rowKey(row)));
 const clearPageSelection=()=>{
  if(!selection)return;
  const pageIdsNow=new Set(rows.map(rowKey));
  selection.onChange(selection.selected.filter(key=>!pageIdsNow.has(key)));
 };
 const exportedRows=selectedPage.length?selectedPage:rows;
 const activeFilters=filters.filter(field=>{
  const raw=params.get(field.urlKey??"filter."+field.key);
  return raw!==null&&raw!==""&&raw!==(field.allValue??"");
 });
 const searchKey=params.toString();
 const hasNarrowing=Boolean(querySearch.trim())||activeFilters.length>0;
 const clearNarrowing=()=>{
  if(searchMode==="controlled"){onSearchChange?.("");return;}
  const updates:Record<string,string>={[searchParam]:""};
  for(const field of filters)updates[field.urlKey??"filter."+field.key]="";
  const next=updateTpoGridQuery(new URLSearchParams(params.toString()),updates);
  setTyped("");router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
 };
 useEffect(()=>{setTyped(querySearch);},[querySearch]);
 useEffect(()=>{
  if(searchMode!=="url"||typed.trim()===querySearch)return;
  const timer=window.setTimeout(()=>{
   const next=updateTpoGridQuery(new URLSearchParams(searchKey),{[searchParam]:typed.trim()});
   router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
  },200);
  return ()=>window.clearTimeout(timer);
 },[typed,querySearch,searchKey,pathname,router,searchParam,searchMode]);
 const changeColumns=(keys:string[])=>{
  if(onColumnKeysChange){onColumnKeysChange(keys);return;}
  if(columnScope==="local"){
   setLocalKeys(keys);
   if(columnStorageKey){try{window.localStorage.setItem(columnStorageKey,keys.join(","));}
    catch{/* Keep the in-page preference even with storage disabled. */}}
   return;
  }
  const defaults=defaultVisibleKeys?.filter(key=>permitted.includes(key))??permitted;
 const reset=keys.length===defaults.length&&keys.every((key,index)=>key===defaults[index]);
  const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{columns:reset?"":keys.join(",")},false);
  router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
 };
 const downloadCsv=()=>{
  if(!rows.length){setNotice("There are no rows on this page to export.");return;}
  try{
   const csv=exportTpoGridCsv(exportColumns,exportedRows);
   const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));
   try{
    const link=document.createElement("a");
    link.href=url;link.download=legacyGridExportFilename(exportName,"csv");
    document.body.appendChild(link);link.click();link.remove();
   }finally{URL.revokeObjectURL(url);}
   setNotice("Exported "+exportedRows.length+" authorized row(s) from this page.");
  }catch{setNotice("Could not prepare the CSV. Please try again.");}
 };
 const copyRows=async()=>{
  if(onCopyRows){onCopyRows();return;}
  const tsv=gridClipboardTsv(exportColumns,exportedRows,true);
  try{await navigator.clipboard.writeText(tsv);
   setNotice("Copied "+exportedRows.length+" row(s) as tab-separated columns.");
  }catch{setNotice("Clipboard access is blocked. Use CSV export instead.");}
 };
 const selectRolls=()=>{
  if(!selection||!rollOf)return;
  const tokens=[...new Set(pasteText.split(/[\s,;]+/).map(part=>part.trim().toLowerCase())
  .filter(part=>Boolean(part)&&!/^\d{1,3}[).]$/.test(part)))];
  if(tokens.length>500){setNotice("Paste at most 500 roll numbers at a time.");return;}
  const lookup=new Map<string,string|null>();
  for(const row of rows){
   const values=rollOf(row);
   const candidates=typeof values==="string"?[values]:Array.isArray(values)?values:[];
   for(const candidate of candidates){
    const key=candidate.trim().toLowerCase();
    if(!key)continue;
    const id=rowKey(row);
    if(lookup.has(key)&&lookup.get(key)!==id)lookup.set(key,null);
    else if(!lookup.has(key))lookup.set(key,id);
   }
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
  <div className="flex min-w-0 flex-wrap items-center gap-2" role="toolbar" aria-label="TPO table tools">
   {searchMode!=="hidden"?<div className="flex w-full min-w-0 max-w-lg flex-1 items-center gap-2 sm:min-w-48">
    <Input className="min-h-11 min-w-0 flex-1 md:min-h-9" aria-label={searchPlaceholder} value={searchMode==="controlled"?querySearch:typed} maxLength={searchMaxLength}
     placeholder={searchPlaceholder} onChange={event=>{
     if(searchMode==="controlled")onSearchChange?.(event.target.value);
     else setTyped(event.target.value);
    }}/>
    <Button variant="secondary" type="button" onClick={()=>{
     if(searchMode==="controlled"){onSearchChange?.(querySearch.trim());return;}
     const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{[searchParam]:typed.trim()});
     router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
    }} className="min-h-11 shrink-0 md:min-h-9"><Image src="/assets/images/common/search.svg" alt="" aria-hidden="true" width={19} height={19}/>Search</Button>
   </div>:null}
   {filters.length||externalFilters?<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
    aria-expanded={externalFilters?.open??filterOpen}
    aria-controls={externalFilters?.controlsId??id+"-filters"}
    onClick={externalFilters?externalFilters.onToggle:()=>setFilterOpen(value=>!value)}>
    Filters{(externalFilters?.count??activeFilters.length)>0?" ("+(externalFilters?.count??activeFilters.length)+")":""}
   </Button>:null}
   <details className="min-w-0 w-full border-b border-border pb-2 sm:w-auto sm:border-0 sm:pb-0">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-link md:min-h-9">Table tools</summary>
    <div className="flex min-w-0 flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
   {savedViews?<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" aria-expanded={viewsOpen}
    aria-controls={id+"-views"} onClick={()=>setViewsOpen(value=>!value)}>Views</Button>:null}
   <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" aria-expanded={columnsOpen}
    aria-controls={id+"-columns"} onClick={()=>setColumnsOpen(value=>!value)}>Columns</Button>
   <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" aria-expanded={exportOpen}
    aria-controls={id+"-export"} onClick={()=>setExportOpen(value=>!value)}>Export</Button>
   <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={!rows.length}
    onClick={()=>void copyRows()}><Image src="/assets/images/common/file-black.svg" alt="" aria-hidden="true" width={16} height={16}/>Copy {selectedPage.length?"selected":"visible"} rows</Button>
   {selection&&rollOf?<Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" aria-expanded={pasteOpen}
    aria-controls={id+"-paste"} onClick={()=>setPasteOpen(value=>!value)}>Paste roll numbers</Button>:null}
    </div>
   </details>
   {extraActions}
  </div>
  {activeFilters.length?<div className="flex flex-wrap gap-2" aria-label="Active grid filters">
   {activeFilters.map(field=><FilterChip key={field.key} type="button" aria-pressed={true}
    aria-label={"Remove "+field.label+" filter"}
    onClick={()=>{
     const next=updateTpoGridQuery(new URLSearchParams(params.toString()),{
      [field.urlKey??"filter."+field.key]:""
     });router.replace(pathname+(next.size?"?"+next.toString():""),{scroll:false});
    }}>
    {field.label}: {field.options.find(opt=>opt.value===params.get(field.urlKey??"filter."+field.key))?.label??"Unknown"} ×
   </FilterChip>)}
  </div>:null}
  {filterOpen&&filters.length?<div id={id+"-filters"}>
   <TpoGridFilterPanel fields={filters} title={filterTitle} mobileSheet autoOpenMobile onAutoClose={()=>setFilterOpen(false)}/>
  </div>:null}
  {viewsOpen&&savedViews?<div id={id+"-views"}>{savedViews}</div>:null}
  {columnsOpen?<div id={id+"-columns"}>
   <TpoGridColumnChooser columns={columns} selected={activeKeys.length?activeKeys:permitted} onChange={changeColumns}/>
  </div>:null}
  {exportOpen?<div id={id+"-export"} className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:flex-wrap sm:items-center">
   <Button variant="secondary" type="button" onClick={()=>{
    if(onExportCsv)onExportCsv(selectedPage.length>0);
    else downloadCsv();
   }} className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={!rows.length}>Export {selectedPage.length?"selected":"visible"} CSV</Button>
   {onExportXlsx?<Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={!rows.length}
    onClick={()=>onExportXlsx(selectedPage.length>0)}>
    Export {selectedPage.length?"selected":"visible"} Excel
   </Button>:null}
   {xlsxHref?<a href={xlsxHref} aria-label={"Export "+(selectedPage.length?"selected":"visible")+" rows to Excel"} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-link lms-inline-link">Export selected XLSX</a>:null}
   <span className="text-xs text-muted-foreground">Exports contain only rows on this page{selectedPage.length?" that are selected":""}; server-side Excel uses existing permissions.</span>
  </div>:null}
  {pasteOpen&&selection&&rollOf?<div id={id+"-paste"} className="space-y-2">
   <label className="block text-[13px] font-semibold">Roll numbers (one per line, space or comma separated)
    <Textarea className="mt-1 w-full min-w-0" value={pasteText} maxLength={15000} rows={3}
     onChange={event=>setPasteText(event.target.value)}/>
   </label>
   <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={!pasteText.trim()} onClick={selectRolls}>
    Select matching students on this page
   </Button>
  </div>:null}
  <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-2 text-sm">
   <span role="status">{rows.length} items in this view{selection?" · "+selectedPage.length+" selected":""}</span>
   {selection&&rows.length?<Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button"
    disabled={selectedPage.length===rows.length}
    onClick={()=>selection.onChange([...new Set([...selection.selected,...rows.map(rowKey)])])}>
    Act on all {rows.length}
   </Button>:null}
  </div>
  {rows.length===0&&hasNarrowing?<div role="status" className="flex flex-wrap items-center gap-2 text-sm">
   <span>{querySearch.trim()?"No rows match the search and active filters.":"No rows match the active filters."}</span>
   <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={clearNarrowing}>Clear search and filters</Button>
  </div>:null}
  {selection&&selectedPage.length?<div role="region" aria-label="Act on these"
    className="flex min-w-0 flex-col items-stretch gap-2 border-b border-border bg-primary-subtle py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
    <strong>{selectedPage.length} selected</strong>
    {act?.(rows,selectedPage,clearPageSelection)}
    <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={()=>void copyRows()}>Copy selected</Button>
    <Button variant="ghost" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" onClick={clearPageSelection}>Clear page selection</Button>
   </div>:null}
  {notice?<InlineNotice
   tone={notice.startsWith("Could not")||notice.startsWith("Clipboard access is blocked")||
    notice.startsWith("There are no rows")||notice.startsWith("Paste at most")?"error":"info"}
   message={notice}/>:null}
  {typeof children==="function"?children(activeKeys):children}
 </section>;
}
