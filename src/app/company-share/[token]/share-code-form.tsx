"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export function ShareCodeForm({action}:{action:string}){
 const [code,setCode]=useState("");
 const valid=/^\d{6}$/.test(code);
 return <form method="post" action={action} className="flex w-full min-w-0 items-stretch">
  <label htmlFor="company-share-code" className="sr-only">6-digit code</label>
  <Input id="company-share-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code"
   placeholder="6-digit code" pattern="[0-9]{6}" required minLength={6} maxLength={6}
   value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,"").slice(0,6))}
   className="min-h-11 min-w-0 flex-1 rounded-r-none border-r-0 md:min-h-10"/>
  <Button type="submit" size="lg" disabled={!valid} className="shrink-0 rounded-l-none">Open</Button>
 </form>;
}
