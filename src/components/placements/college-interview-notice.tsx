"use client";

import {useState} from "react";
import {Banner} from "@/components/ui/banner";
import {Button} from "@/components/ui/button";

/** Historical interview warnings can be dismissed without changing filters. */
export function CollegeInterviewNotice({message}:{message:string}){
 const [visible,setVisible]=useState(true);
 if(!visible)return null;
 return <Banner tone="warning" action={
  <Button type="button" variant="ghost" size="sm" onClick={()=>setVisible(false)}
   aria-label="Dismiss interview warning">Dismiss</Button>
 }>{message}</Banner>;
}
