"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

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
 return <span role="status" aria-live="polite" className="sr-only">Opening settings…</span>;
}
