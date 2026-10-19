import type {ShellNavIconName} from "./shell-model";

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
};
export function ShellNavGlyph({name}:{name:ShellNavIconName}){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"
   width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
   strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
  <path d={paths[name]}/>
 </svg>;
}
export function ShellLogoMark(){
 return <svg aria-hidden="true" focusable="false" viewBox="0 0 40 38" width="38" height="36">
  <path fill="#26bac7" d="M19 2 3 9v18l16 9 17-9V9L19 2Zm0 5 12 5v12l-12 7L8 24V12l11-5Z"/>
  <path fill="#1a95a1" d="m11 15 8-4 9 4v5l-9 5-8-5v-5Zm8 1-3 1.5 3 1.5 3-1.5-3-1.5Z"/>
 </svg>;
}
