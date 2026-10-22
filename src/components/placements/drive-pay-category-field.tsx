"use client";
import {useState} from "react";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {
  DRIVE_PAY_CATEGORIES,DRIVE_PAY_CATEGORY_LABEL,DRIVE_PAY_CATEGORY_REASON_MAX,
  DRIVE_PAY_CATEGORY_REASON_REQUIRED,drivePayCategoryFromMaxCtcLpa,isDrivePayCategory,
  type DrivePayCategory,
} from "@/modules/placements/drive-pay-category-model";

/** What the submitted form says about the pay category. Read from FormData:
 * `categoryOverride` (checkbox), `legacyJobCategory` and `categoryOverrideReason`. */
export function readDrivePayCategoryFields(fields:FormData):
  {ok:true;legacyJobCategory:DrivePayCategory|null;categoryOverrideReason:string|null}|
  {ok:false;message:string}{
  if(fields.get("categoryOverride")!=="on")
    return {ok:true,legacyJobCategory:null,categoryOverrideReason:null};
  const category=String(fields.get("legacyJobCategory")??"");
  if(!isDrivePayCategory(category))return {ok:false,message:"Choose a category to override."};
  const reason=String(fields.get("categoryOverrideReason")??"").trim();
  if(!reason)return {ok:false,message:DRIVE_PAY_CATEGORY_REASON_REQUIRED};
  if(reason.length>DRIVE_PAY_CATEGORY_REASON_MAX)
    return {ok:false,message:"Keep the category reason within "+DRIVE_PAY_CATEGORY_REASON_MAX+" characters."};
  return {ok:true,legacyJobCategory:category,categoryOverrideReason:reason};
}

/** Legacy drive pay category: Regular / Dream / Super dream worked out from the
 * highest CTC (>= 10 LPA Dream, >= 20 LPA Super dream) with an override that
 * always needs a reason. */
export function DrivePayCategoryField({maxCtcLpa,initialCategory=null,initialReason="",disabled=false,
  inputClassName,onChange}:{
  maxCtcLpa:number|null;initialCategory?:DrivePayCategory|null;initialReason?:string;
  disabled?:boolean;inputClassName?:string;onChange?:()=>void;
}){
  const [override,setOverride]=useState(initialCategory!==null);
  const [category,setCategory]=useState<DrivePayCategory>(initialCategory??"REGULAR");
  const automatic=drivePayCategoryFromMaxCtcLpa(maxCtcLpa);
  const shown=override?category:automatic;
  return <section aria-label="Pay category" className="min-w-0 space-y-2 border-y border-border py-3">
   <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-body">
    <p className="m-0">Category: <strong className="rounded-full border border-border px-2 py-0.5 text-foreground">
     {DRIVE_PAY_CATEGORY_LABEL[shown]}</strong>{override?"":" worked out from the CTC"}</p>
    <label className="flex min-h-11 items-center gap-2 font-semibold md:min-h-9">
     <Checkbox name="categoryOverride" data-skip-backup="true" checked={override} disabled={disabled}
      onChange={event=>{setOverride(event.target.checked);onChange?.();}}/>
     Override
    </label>
   </div>
   {override?<div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Category
     <Select name="legacyJobCategory" data-skip-backup="true" value={category} disabled={disabled} className={inputClassName}
      onChange={event=>{
       if(isDrivePayCategory(event.target.value))setCategory(event.target.value);
       onChange?.();
      }}>
      {DRIVE_PAY_CATEGORIES.map(value=><option key={value} value={value}>{DRIVE_PAY_CATEGORY_LABEL[value]}</option>)}
     </Select>
    </label>
    <label className="block text-[13px] font-semibold text-[var(--lms-neutral-400)]">Why
     <Input name="categoryOverrideReason" data-skip-backup="true" required maxLength={DRIVE_PAY_CATEGORY_REASON_MAX}
      defaultValue={initialReason} disabled={disabled} className={inputClassName}
      onChange={()=>onChange?.()}/>
    </label>
   </div>:null}
  </section>;
}
