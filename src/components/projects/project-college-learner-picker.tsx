"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type LearnerChoice={membershipId:string;displayName:string;rollNumber:string};

/** Server-filtered learner directory, with selections retained across pages.
 * The workspace mutation independently validates every selected membership.
 */
export function ProjectCollegeLearnerPicker({collegeId,selectedIds,onChange}:{
  collegeId:string;selectedIds:readonly string[];onChange:(ids:string[])=>void;
}){
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(0);
  const [rows,setRows]=useState<LearnerChoice[]>([]);
  const [selectedNames,setSelectedNames]=useState<LearnerChoice[]>([]);
  const [hasMore,setHasMore]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError("");
    const timer=window.setTimeout(()=>{
      void fetch("/api/projects/learner-candidates?collegeId="+encodeURIComponent(collegeId)+
        "&q="+encodeURIComponent(query.trim())+"&page="+page,
        {cache:"no-store",signal:controller.signal})
        .then(async response=>{
          if(!response.ok)throw new Error("Could not load eligible college learners.");
          return response.json() as Promise<{candidates:LearnerChoice[];hasMore:boolean}>;
        }).then(result=>{if(!controller.signal.aborted){
          setRows(result.candidates);setHasMore(result.hasMore);
        }}).catch(e=>{if(!controller.signal.aborted)
          setError(e instanceof Error?e.message:"Could not search learners.");
        }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    },400);
    return()=>{window.clearTimeout(timer);controller.abort();};
  },[collegeId,page,query,retry]);
  return <section aria-label="Select college learners"
    className="min-w-0 space-y-3 border-y border-border py-4 md:col-span-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Learners · {selectedIds.length} selected</h3>
        <p className="mt-1 text-xs text-body">
          Select up to 500 eligible college learners. Only selected learners join this workspace.
        </p>
      </div>
      <Button type="button" size="sm" variant="ghost" disabled={!selectedIds.length}
        onClick={()=>{onChange([]);setSelectedNames([]);}}>Clear selection</Button>
    </div>
    <Input type="search" aria-label="Search college learners" value={query} maxLength={120}
      placeholder="Search name or roll number"
      onChange={event=>{setQuery(event.target.value);setPage(0);}}/>
    {loading?<p role="status" className="text-xs text-body">Searching learners…</p>:null}
    {error?<div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-error">
      {error}<Button type="button" variant="secondary" size="sm"
        onClick={()=>setRetry(v=>v+1)}>Retry</Button>
    </div>:null}
    <div className="max-h-52 min-w-0 divide-y divide-border overflow-y-auto border-y border-border">
      {rows.map(row=>{
        const checked=selectedIds.includes(row.membershipId);
        return <label key={row.membershipId}
          className="flex min-h-11 min-w-0 items-center gap-2 py-2 text-sm text-body">
          <Checkbox checked={checked} disabled={!checked&&selectedIds.length>=500}
            onChange={event=>{
              const next=event.target.checked;
              if(next){
                if(selectedIds.length>=500||checked)return;
                onChange([...selectedIds,row.membershipId]);
                setSelectedNames(old=>old.some(item=>item.membershipId===row.membershipId)?
                  old:[...old,row]);
              }else{
                onChange(selectedIds.filter(id=>id!==row.membershipId));
                setSelectedNames(old=>old.filter(item=>item.membershipId!==row.membershipId));
              }
            }}/>
          <span className="min-w-0 break-words">{row.displayName} · {row.rollNumber}</span>
        </label>;
      })}
      {!loading&&!error&&!rows.length?<p className="p-2 text-sm text-body">
        No learners match the current search.</p>:null}
    </div>
    <div className="flex flex-wrap items-center gap-2 text-xs text-body">
      <Button type="button" size="sm" variant="secondary" disabled={loading||page===0}
        onClick={()=>setPage(v=>Math.max(0,v-1))}>Previous</Button>
      <span>Page {page+1}</span>
      <Button type="button" size="sm" variant="secondary" disabled={loading||!hasMore}
        onClick={()=>setPage(v=>v+1)}>Next</Button>
    </div>
    {selectedIds.length?<details className="text-xs text-body">
      <summary className="cursor-pointer font-semibold">
        Review selected learners ({selectedIds.length})
      </summary>
      <ul className="mt-2 max-h-36 overflow-y-auto">
        {selectedNames.filter(row=>selectedIds.includes(row.membershipId)).map(row=>
          <li key={row.membershipId}>{row.displayName} · {row.rollNumber}</li>)}
        {selectedIds.length>selectedNames.filter(row=>selectedIds.includes(row.membershipId)).length?
          <li>{selectedIds.length-selectedNames.filter(row=>selectedIds.includes(row.membershipId)).length} additional selections</li>:null}
      </ul>
    </details>:null}
  </section>;
}
