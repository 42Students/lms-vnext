"use client";

import {useEffect,useState} from "react";

/** Legacy PlacementsCompanyAvatar colour/hash and 56px employer hero.
 * Only public HTTPS logo URLs are eligible for remote rendering. Broken
 * images fall back to the original letter tile and retry on URL changes. */
const AVATAR_COLORS=[
 {bg:"#e8f4fd",text:"#0c63d4"},
 {bg:"#e8f5e9",text:"#2e7d32"},
 {bg:"#f3e5f5",text:"#7b1fa2"},
 {bg:"#fff3e0",text:"#e65100"},
 {bg:"#e0f2f1",text:"#00695c"},
 {bg:"#fce4ec",text:"#c2185b"},
 {bg:"#e8eaf6",text:"#3949ab"},
 {bg:"#f1f8e9",text:"#558b2f"},
] as const;
function avatarColor(name:string){
 let hash=0;
 for(let i=0;i<name.length;i++)hash=name.charCodeAt(i)+((hash<<5)-hash);
 return AVATAR_COLORS[Math.abs(hash)%AVATAR_COLORS.length] ?? {bg:"#e8f4fd",text:"#0c63d4"};
}
export function DriveCompanyAvatar({name,logoUrl}:{name:string;logoUrl:string|null}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[logoUrl]);
 const initial=(name||"?").charAt(0).toUpperCase();
 const palette=avatarColor(name);
 const showLogo=Boolean(logoUrl&&logoUrl.startsWith("https://")&&!failed);
 return <span aria-label={name+" logo"}
  className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border"
  style={{background:showLogo?"#fff":palette.bg,color:palette.text,
   fontSize:18,fontWeight:600}}>
  {showLogo&&logoUrl?<img src={logoUrl} alt={name} loading="lazy"
    referrerPolicy="no-referrer" className="h-full w-full object-contain p-1"
    onError={()=>setFailed(true)}/>:initial}
 </span>;
}
