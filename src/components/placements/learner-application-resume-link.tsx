"use client";
import {useState} from "react";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";
export function LearnerApplicationResumeLink({applicationId}:{applicationId:string}){
 const [state,setState]=useState<{
  status:"IDLE"|"LOADING"|"READY"|"ABSENT"|"ERROR";
  url:string|null;expiresAt:string|null;
 }>({status:"IDLE",url:null,expiresAt:null});
 async function load(){
  setState({status:"LOADING",url:null,expiresAt:null});
  try{
   const response=await fetch(
    "/api/placements/learner/applications/"+encodeURIComponent(applicationId)+"/resume",
    {cache:"no-store",credentials:"same-origin"});
   if(!response.ok)throw new Error("UNAVAILABLE");
   const body=await response.json() as {
    ready:boolean;readUrl?:string;expiresAt?:string;
   };
   if(!body.ready){setState({status:"ABSENT",url:null,expiresAt:null});return;}
   const candidate=new URL(body.readUrl??"");
   if(candidate.protocol!=="https:"||candidate.username||candidate.password)
    throw new Error("INVALID_URL");
   setState({status:"READY",url:candidate.toString(),
    expiresAt:body.expiresAt??null});
  }catch{
   setState({status:"ERROR",url:null,expiresAt:null});
  }
 }
 return <span className="mt-1 block text-xs">
  {state.status==="READY"&&state.url
   ?<TextLink href={state.url}>
      View scanned application resume (temporary private link) ↗
    </TextLink>
   :<Button variant="link" size="inline" type="button" onClick={()=>void load()}
      disabled={state.status==="LOADING"}
      className="text-left">
      {state.status==="LOADING"?"Checking resume…":"Check current application resume"}
    </Button>}
  {state.status==="ABSENT"?<span role="status" className="block">
    No current resume was verified for this application.</span>:null}
  {state.status==="ERROR"?<span role="alert" className="block">
    Resume is unavailable; no private file was exposed.</span>:null}
  {state.status==="READY"&&state.expiresAt?<span className="block">
    Link expires {istDateTimeFormatter.format(new Date(state.expiresAt))}.</span>:null}
 </span>;
}
