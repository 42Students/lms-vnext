"use client";

import {useEffect,useState} from "react";

/** Legacy PlacementsCompanyAvatar colour/hash and 56px employer hero.
 * Only public HTTPS logo URLs are eligible for remote rendering. Broken
 * images fall back to the original letter tile and retry on URL changes. */
const AVATAR_COLORS=[
 {bg:"var(--lms-info-blue-surface)",text:"var(--lms-info-blue)"},
 {bg:"var(--lms-success-surface)",text:"var(--lms-success-strong)"},
 {bg:"var(--lms-purple-surface)",text:"var(--lms-purple-text)"},
 {bg:"var(--lms-gold-subtle)",text:"var(--lms-warning)"},
 {bg:"var(--lms-primary-subtle)",text:"var(--lms-button-primary-hover)"},
 {bg:"var(--lms-error-surface)",text:"var(--lms-error-strong)"},
 {bg:"var(--lms-border)",text:"var(--lms-icon-purple)"},
 {bg:"var(--lms-success-surface)",text:"var(--lms-success-strong)"},
] as const;
function avatarColor(name:string){
 let hash=0;
 for(let i=0;i<name.length;i++)hash=name.charCodeAt(i)+((hash<<5)-hash);
 return AVATAR_COLORS[Math.abs(hash)%AVATAR_COLORS.length] ?? {bg:"var(--lms-info-blue-surface)",text:"var(--lms-info-blue)"};
}
export function DriveCompanyAvatar({name,logoUrl}:{name:string;logoUrl:string|null}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[logoUrl]);
 const initial=(name||"?").charAt(0).toUpperCase();
 const palette=avatarColor(name);
 const showLogo=Boolean(logoUrl&&logoUrl.startsWith("https://")&&!failed);
 return <span aria-label={name+" logo"}
  className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border"
  style={{background:showLogo?"var(--lms-white)":palette.bg,color:palette.text,
   fontSize:18,fontWeight:600}}>
  {showLogo&&logoUrl?<img src={logoUrl} alt={name} loading="lazy"
    referrerPolicy="no-referrer" className="h-full w-full object-contain p-1"
    onError={()=>setFailed(true)}/>:initial}
 </span>;
}
