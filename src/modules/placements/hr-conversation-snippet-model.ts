export function conversationSnippet(raw:string,max=120) {
 const clean=raw.replace(/\s+/g," ").trim();
 return clean.length>max?clean.slice(0,max-1)+"…":clean;
}
