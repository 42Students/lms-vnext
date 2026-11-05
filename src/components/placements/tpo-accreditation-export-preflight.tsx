"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import { ButtonLink } from "@/components/ui/button-link";

type MissingField={label:string;missing:number};

/** Mirrors the legacy NAAC confirmation: count the incomplete records before
 * allowing an intentional download. The CSV itself remains server-authorized. */
export function TpoAccreditationExportPreflight({
 href,total,missingStudents,fields,compact=false,
}:{
 href:string;total:number;missingStudents:number;
 fields:readonly MissingField[];compact?:boolean;
}){
 const [open,setOpen]=useState(false);
 const label=compact?"Export anyway":"Export student list CSV";
 const className="min-h-11 w-full sm:w-auto md:min-h-9";
 if(missingStudents===0)return <ButtonLink variant="primary" href={href}
   className="w-full sm:w-auto">
   {label}
  </ButtonLink>;
 return <>
  <Button type="button" variant={compact?"secondary":"primary"} className={className}
   onClick={()=>setOpen(true)}>{label}</Button>
  <Dialog open={open} onOpenChange={setOpen} title="Export with missing information?"
   description="Some student records are incomplete. Review the counts before you export."
   footer={<>
    <Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button>
    <ButtonLink variant="primary" href={href} onClick={()=>setOpen(false)}>
     Export anyway
    </ButtonLink>
   </>}>
   <p className="text-sm leading-6 text-body"><strong>{missingStudents} of {total}</strong> students are missing information required for NAAC/NIRF.</p>
   <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-body">
    {fields.filter(field=>field.missing>0).map(field=>
     <li key={field.label}>{field.label} — missing for {field.missing}</li>)}
   </ul>
   <p className="mt-3 text-xs text-muted-foreground">Missing values remain blank in the CSV; exporting does not certify completeness.</p>
  </Dialog>
 </>;
}
