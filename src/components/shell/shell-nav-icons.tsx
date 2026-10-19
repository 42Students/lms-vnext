import type {ShellNavIconName} from "./shell-model";
import {legacyAntPaths} from "./legacy-ant-paths";

/** Inline, stroke-based icons: lucide-react is not installed in lms-vnext.
 * Using SVG instead of initial-letter boxes preserves the legacy icon rail. */
const paths:Record<ShellNavIconName,string>={
 home:"M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z",
 dashboard:"M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z",
 school:"M3 10 12 4l9 6-9 6z M6 13v6c4 2 8 2 12 0v-6 M21 10v7",
 building:"M4 21V5l8-3 8 3v16 M9 21v-5h6v5 M8 8h.01 M12 8h.01 M16 8h.01 M8 12h.01 M12 12h.01 M16 12h.01",
 sliders:"M4 6h16 M4 12h16 M4 18h16 M9 3v6 M16 9v6 M11 15v6",
 puzzle:"M10 3H4v7h2a2 2 0 1 1 0 4H4v7h7v-2a2 2 0 1 1 4 0v2h6v-7h-2a2 2 0 1 1 0-4h2V3h-7v2a2 2 0 1 1-4 0z",
 settings:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 9l2-1 1-3 3 1 2-2 2 2 3-1 1 3 2 1v6l-2 1-1 3-3-1-2 2-2-2-3 1-1-3-2-1z",
 history:"M3 12a9 9 0 1 0 3-7 M3 4v5h5 M12 7v5l4 2",
 mail:"M3 5h18v14H3z M3 6l9 7 9-7",
 book:"M5 3h15v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z M5 17h15",
 users:"M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M17 4a4 4 0 0 1 0 8 M18 15a6 6 0 0 1 4 6",
 shield:"M12 2l8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6z M8 12l3 3 5-6",
 briefcase:"M3 7h18v13H3z M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M3 12h18 M10 12v2h4v-2",
 folder:"M3 6h7l2 2h9v12H3z",
 calendar:"M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M7 14h3 M13 14h3 M7 17h3",
 checklist:"M8 6h13 M8 12h13 M8 18h13 M3 6l1 1 2-3 M3 12l1 1 2-3 M3 18l1 1 2-3",
 clipboard:"M7 5H5v16h14V5h-2 M9 3h6v4H9z M8 12h8 M8 16h5",
 messages:"M4 4h16v13H9l-5 4z M8 9h8 M8 13h5",
 bell:"M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
 megaphone:"M3 10h4l12-6v14L7 13H3z M6 14l2 6h4l-3-6 M20 9l2 2-2 2",
 chart:"M3 21V3 M3 21h18 M7 17v-5 M12 17V8 M17 17V5",
 contact:"M4 3h16v18H4z M8 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M7 15a4 4 0 0 1 8 0 M16 9h2 M16 13h2",
 search:"M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16 M17 17l5 5",
 layers:"M3 8l9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5",
 user:"M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10 M3 22v-2a9 9 0 0 1 18 0v2",
 award:"M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M8 13l-2 9 6-3 6 3-2-9",
 target:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 12h.01",
 clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l4 2",
 table:"M3 4h18v16H3z M3 10h18 M3 15h18 M9 4v16",
 inbox:"M3 4h18v16H3z M3 13h5l2 3h4l2-3h5",
 help:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 18h.01",
 comment:"M4 4h16v13H9l-5 4V4z",
 "check-circle":"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M8 12l3 3 5-6",
 "file-text":"M6 2h9l5 5v15H6V2z M15 2v5h5 M9 12h8 M9 16h8",
 wrench:"M21 7a6 6 0 0 1-8 6L7 19a3 3 0 0 1-4-4l6-6a6 6 0 0 1 7-8l-4 4 3 3 4-4a6 6 0 0 1 2 3z",
 solution:"M4 3h16v18H4z M7 7h10 M7 11h5 M7 15h4 M15 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M12 19a3 3 0 0 1 6 0",
 "usergroup-add":"M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M18 5v8 M14 9h8",
 bank:"M2 9l10-6 10 6 M4 10h16 M6 10v9 M11 10v9 M16 10v9 M3 20h18 M2 22h20",
 appstore:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 partition:"M12 3v6 M4 9h16 M4 9v8 M12 9v8 M20 9v8 M2 17h4v4H2z M10 17h4v4h-4z M18 17h4v4h-4z",
 apartment:"M3 21V8h7V3h8v18 M7 12h2 M7 16h2 M13 7h2 M13 11h2 M13 15h2 M11 21v-4h4v4 M20 21H2",

};
export function ShellNavGlyph({name}:{name:ShellNavIconName}){
 const legacy=legacyAntPaths[name];
 if(legacy)return <svg aria-hidden="true" focusable="false" viewBox="0 0 1024 1024"
   width="20" height="20" fill="currentColor" className="h-5 w-5">
  {legacy.map((d,i)=><path key={i} d={d}/>)}
 </svg>;
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"
   width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
   strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
  <path d={paths[name]}/>
 </svg>;
}
/** Exact icon paths and fills from old lms2-fe/public/assets/images/logo.svg.
 * Only the original 41px logomark is used; the wordmark is intentionally hidden. */
export function ShellLogoMark(){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 41 38" width="38" height="36" fill="none">
  <path d="M34.3559 30.0236C35.8064 27.7119 36.5736 25.0405 36.5697 22.3151C36.5697 14.2602 30.0083 7.73047 21.9144 7.73047C21.7449 7.73047 21.5774 7.73766 21.4092 7.74354V37.0018H40.2958V30.0236H34.3559Z" fill="#266891"/>
  <path d="M0 27.3826H17.2627V37H25.6174V27.3826V24.427V0L0 27.3826Z" fill="#9EE4E8"/>
  <path d="M25.6174 24.4274V8.20052C24.4082 7.88762 23.1638 7.72966 21.9144 7.73047C21.7449 7.73047 21.5774 7.73766 21.4092 7.74354V37.0018H25.6174V24.4274Z" fill="#26BAC7"/>
 </svg>;
}
