/** Safe source text normalization, never decode arbitrary filesystem URLs. */
export function normalizedImportedSkillName(name:string){
 let decoded=name.trim();
 try{decoded=decodeURIComponent(decoded);}catch{/* Malformed percent sequences stay raw. */}
 decoded=decoded.normalize("NFKC").replace(/\s+/g," ").toLocaleLowerCase("en-US");
 return decoded.length&&decoded.length<=200?decoded:null;
}
export function normalizeImportedSynonym(value:string){
 const text=normalizedImportedSkillName(value);
 return text&&text.length<=100?text:null;
}
export function legacySkillTimestampIst(raw:string|null){
 if(!raw||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw))return null;
 const d=new Date(raw.replace(" ","T")+"+05:30");
 return Number.isFinite(d.getTime())?d:null;
}
export function importSkillSynonyms(skillId:string,source:readonly string[]){
 const unique=new Map<string,string>();
 for(const raw of source){const normal=normalizeImportedSynonym(raw);if(normal&&!unique.has(normal))unique.set(normal,raw);}
 return [...unique].map(([synonym])=>({skillId,synonym}));
}
