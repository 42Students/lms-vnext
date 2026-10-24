export type MentorSearchRankable={key:string;title:string;context:string};
export function mentorSearchRank(
 name:string,query:string,
):0|1|2|3{
 const text=name.trim().toLocaleLowerCase("en-IN");
 const q=query.trim().toLocaleLowerCase("en-IN");
 if(!q)return 3;
 if(text===q)return 0;
 if(text.startsWith(q))return 1;
 if(text.includes(q))return 2;
 return 3;
}
export function sortMentorSearchMatches<T extends MentorSearchRankable>(
 rows:readonly T[],query:string,
):T[]{
 return [...rows].sort((a,b)=>
  mentorSearchRank(a.title,query)-mentorSearchRank(b.title,query)||
  a.title.localeCompare(b.title,"en-IN")||
  a.context.localeCompare(b.context,"en-IN")||
  a.key.localeCompare(b.key));
}
/** Render highlighted text using React <mark> rather than dangerouslySetInnerHTML.
 * The actual result was already authorized by the server.
 */
export function mentorSearchHighlightParts(title:string,query:string):
 Array<{text:string;highlight:boolean}>{
 const raw=query.trim();
 if(!raw||raw.length>100)return [{text:title,highlight:false}];
 const lowered=title.toLocaleLowerCase("en-IN");
 const lowerQ=raw.toLocaleLowerCase("en-IN");
 // Case-folding may change string length for some Unicode characters.
 // Preserve original character boundaries: highlight only same-length folds.
 if(lowered.length!==title.length||lowerQ.length!==raw.length)
  return [{text:title,highlight:false}];
 const parts:Array<{text:string;highlight:boolean}>=[];
 let cursor=0;
 while(cursor<title.length){
  const at=lowered.indexOf(lowerQ,cursor);
  if(at<0)break;
  if(at>cursor)parts.push({text:title.slice(cursor,at),highlight:false});
  parts.push({text:title.slice(at,at+raw.length),highlight:true});
  cursor=at+raw.length;
 }
 if(cursor<title.length)parts.push({text:title.slice(cursor),highlight:false});
 return parts.length?parts:[{text:title,highlight:false}];
}
