"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {LoginForm} from "@/components/auth/login-form";

type Props={
 collegeName?:string|null;legacySuperAdmin?:boolean;
 defaultChannel?:"EMAIL"|"PHONE";allowedChannels?:readonly ("EMAIL"|"PHONE")[];
};

/** DGI's old Student/Teacher switch clears its OTP entry. Remounting the
 * shared form clears local contact, verification, errors, and cached input.
 * Switching the visual preference never grants a student or teacher role.
 */
export function DgipucSignIn(props:Props){
 const [role,setRole]=useState<"STUDENT"|"TEACHER">("STUDENT");
 return <div className="min-w-0 space-y-3">
  <div role="group" aria-label="Sign in as" className="grid grid-cols-2 gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1">
   {(["STUDENT","TEACHER"] as const).map(next=>
    <Button key={next} type="button" variant="ghost" aria-pressed={role===next}
     onClick={()=>setRole(next)}
     className={"min-h-11 md:min-h-9 "+(role===next
       ?"bg-white font-semibold text-primary-text shadow-sm"
       :"text-body hover:text-primary-text")}>
     {next==="STUDENT"?"Student":"Teacher"}
    </Button>)}
  </div>
  <p className="text-xs leading-5 text-muted-foreground">Changing roles clears the form. Choose a verified college membership after sign-in.</p>
  <LoginForm key={role} {...props}/>
 </div>;
}
