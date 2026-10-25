"use client";
import {useRef,useState} from "react";
import {Button} from "@/components/ui/button";

/** Six visible positions, one real accessible text input. Paste/autofill stays
 * atomic instead of fighting six different input focus/clipboard states. */
export function ShareCodeForm({action}:{action:string}){
 const [code,setCode]=useState("");
 const input=useRef<HTMLInputElement>(null);
 const valid=/^[A-Z0-9]{6}$/.test(code);
 return <form method="post" action={action} className="min-w-0 space-y-3">
  <label htmlFor="company-share-code" className="block text-sm font-semibold text-foreground">
   Enter the code from your placement cell
  </label>
  <p id="company-share-code-help" className="text-sm text-body">
   The six-character code came with this link. It keeps students' details safe.
  </p>
  <div className="relative" onClick={()=>input.current?.focus()}>
   <div aria-hidden="true" className="grid grid-cols-6 gap-2">
    {Array.from({length:6},(_,index)=><span key={index} className={
      "flex h-14 min-w-0 items-center justify-center rounded-lg border border-border bg-surface text-xl font-semibold text-foreground "+
      "group-focus-within:border-primary"
     }>{code[index]??"\u00a0"}</span>)}
   </div>
   <input id="company-share-code" ref={input} name="code" type="text"
    inputMode="text" autoComplete="one-time-code" spellCheck={false}
    autoCapitalize="characters" aria-describedby="company-share-code-help"
    pattern="[A-Za-z0-9]{6}" required minLength={6} maxLength={6}
    value={code}
    onChange={event=>setCode(event.target.value.replace(/[^a-z0-9]/gi,"").toUpperCase().slice(0,6))}
    className="absolute inset-0 h-full w-full cursor-text opacity-0 focus-visible:outline-none"/>
  </div>
  <Button type="submit" size="lg" disabled={!valid} className="min-h-11 w-full">
   Open the list
  </Button>
 </form>;
}
