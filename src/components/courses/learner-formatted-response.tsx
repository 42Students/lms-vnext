import type {ReactNode} from "react";
/** Render learner-authored formatting as React nodes, never as an HTML string. */
export function formatLearnerResponseLine(input:string):ReactNode[]{
 return input.split(/(\*\*[^*\n]+\*\*|_[^_\n]+_)/g).map((part,index)=>{
  if(part.startsWith("**")&&part.endsWith("**")&&part.length>4)return <strong key={index}>{part.slice(2,-2)}</strong>;
  if(part.startsWith("_")&&part.endsWith("_")&&part.length>2)return <em key={index}>{part.slice(1,-1)}</em>;
  return <span key={index}>{part}</span>;
 });
}
export function LearnerFormattedResponse({text}: {text:string}){
 const lines=text.split(/\r?\n/).slice(0,5000);
 return <div className="space-y-1 break-words text-sm text-body">
  {lines.map((line,index)=>line.startsWith("- ")
   ?<p key={index} className="pl-3">• {formatLearnerResponseLine(line.slice(2))}</p>
   :<p key={index}>{line?formatLearnerResponseLine(line):"\u00a0"}</p>)}
 </div>;
}
