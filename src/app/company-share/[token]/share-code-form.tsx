"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export function ShareCodeForm({action}:{action:string}){
 const [code,setCode]=useState("");
 const valid=/^[A-Z0-9]{6}$/.test(code);
 return <form method="post" action={action} className="flex w-full min-w-0 items-stretch">
  <label htmlFor="company-share-code" className="sr-only">6-character access code</label>
  <Input id="company-share-code" name="code" type="text" inputMode="text" autoComplete="one-time-code"
   placeholder="6-character code" pattern="[A-Za-z0-9]{6}" required minLength={6} maxLength={6}
   value={code} onChange={event=>setCode(event.target.value.replace(/[^a-z0-9]/gi,"").toUpperCase().slice(0,6))}
   className="min-h-11 min-w-0 flex-1 rounded-r-none border-r-0"/>
  <Button type="submit" size="lg" disabled={!valid} className="shrink-0 rounded-l-none">Open</Button>
 </form>;
}
