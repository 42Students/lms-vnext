/** Render only complete HTTPS URLs as outbound links in announcement text.
 * Text and invalid URLs remain text; Next/React handles escaping.
 */
export type TpoNoticeTextPart={kind:"text"|"link";value:string};
export function tpoNoticeTextParts(body:string):TpoNoticeTextPart[]{
 const result:TpoNoticeTextPart[]=[];
 const pattern=/https:\/\/[^\s<>"']+/g;
 let previous=0;
 for(const match of body.matchAll(pattern)){
  const start=match.index;
  if(start>previous)result.push({kind:"text",value:body.slice(previous,start)});
  const token=match[0];
  const suffix=token.match(/[.,;!?)\]]+$/)?.[0]??"";
  const candidate=token.slice(0,token.length-suffix.length);
  try{
   const url=new URL(candidate);
   if(url.protocol!=="https:"||!url.hostname)throw new Error("invalid HTTPS URL");
   result.push({kind:"link",value:candidate});
  }catch{result.push({kind:"text",value:candidate});}
  if(suffix)result.push({kind:"text",value:suffix});
  previous=start+token.length;
 }
 if(previous<body.length)result.push({kind:"text",value:body.slice(previous)});
 return result.length?result:[{kind:"text",value:body}];
}
