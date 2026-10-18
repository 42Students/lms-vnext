export function conversationSnippet(raw:string,max=120) {
 const clean=raw.replace(/\s+/g," ").trim();
 const limit=Number.isFinite(max)?Math.max(0,Math.min(500,Math.trunc(max))):120;
 if(limit===0)return "";
 if(clean.length<=limit)return clean;
 const clipped=clean.slice(0,limit-1);
 const intact=/[\uD800-\uDBFF]$/.test(clipped)?clipped.slice(0,-1):clipped;
 return intact+"…";
}
