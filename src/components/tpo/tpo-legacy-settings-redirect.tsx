"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {usePathname} from "next/navigation";

/** Legacy placement-settings deep links used tab= and #hash bookmarks. */
const LEGACY_TABS:Record<string,string>={
 rules:"rules",jobtypes:"job-types",outcomes:"after-college",
 prep:"prep-readiness",blocked:"blocked-dates",recruiters:"recruiters",
 notices:"notices",see:"see",webpage:"public-page",branding:"branding",
 season:"season",trusted:"trusted",templates:"templates",team:"team",
 job_types:"job-types",job_types_tab:"job-types",aftercollege:"after-college",
 publicpage:"public-page",publiclink:"public-link",notifications:"notifications",
};
export function TpoLegacySettingsRedirect({tab}:{tab?:string}){
 const router=useRouter();
 useEffect(()=>{
  const rawHash=window.location.hash.slice(1);
  let hash=rawHash;
  try{hash=decodeURIComponent(rawHash);}catch{/* Invalid bookmark encoding falls back to the safe default. */}
  const key=(tab||hash.replace(/^tab=/i,"")||"rules").trim().toLowerCase().replace(/^\//,"");
  router.replace("/tpo/settings/"+(LEGACY_TABS[key]??"rules"));
 },[tab,router]);
 return <div role="status" aria-live="polite" className="flex min-h-24 min-w-0 items-center gap-3 py-6 text-sm text-[var(--lms-body-text)]"><span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />Opening settings…</div>;
}

/** Preserve bookmarked #section tabs while allowing a real Settings index.
 * This component does not navigate on ordinary /tpo/settings visits. */
export function TpoSettingsHashRedirect(){
 const router=useRouter();
 const path=usePathname();
 useEffect(()=>{
  if(path!=="/tpo/settings"||!window.location.hash)return;
  let hash=window.location.hash.slice(1);
  try{hash=decodeURIComponent(hash);}catch{return;}
  const key=hash.replace(/^tab=/i,"").trim().toLowerCase().replace(/^\//,"");
  if(!key)return;
  router.replace("/tpo/settings/"+(LEGACY_TABS[key]??"rules"));
 },[router,path]);
 return null;
}
