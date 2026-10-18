export function conversationSnippet(raw:string,max=120) {
 const clean=raw.replace(/\s+/g," ").trim();
 const limit=Number.isFinite(max)?Math.max(0,Math.min(500,Math.trunc(max))):120;
 if(limit===0)return "";
 return clean.length>limit?clean.slice(0,limit-1)+"…":clean;
}
