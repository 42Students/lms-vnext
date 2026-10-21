import {z} from "zod";

/** Offline, admin-supplied catalog import. Never pull untrusted remote URLs
 * or treat arbitrary skill names as known synonyms without review. */
export const skillCatalogImportSchema=z.strictObject({
 format:z.enum(["CSV","RTF"]),
 content:z.string().min(1).max(200_000),
 dryRun:z.boolean().default(true),
}).superRefine((input,ctx)=>{
 if(input.format==="RTF"&&!/^\{\\rtf[0-9]/i.test(input.content.trimStart()))
  ctx.addIssue({code:"custom",path:["content"],message:"Expected an RTF document"});
});
export type SkillImportRow={
 normalizedName:string;displayName:string;category:string|null;
 synonyms:string[];sourceLine:number;
};
export type SkillImportRejected={line:number;reason:string};
export type SkillImportParsed={
 rows:SkillImportRow[];rejected:SkillImportRejected[];
 duplicates:{name:string;sourceLines:number[]}[];truncated:boolean;
};
function csvCells(source:string){
 const rows:string[][]=[];let cells:string[]=[],value="",quoted=false;
 for(let i=0;i<source.length;i++){
  const c=source[i]!;
  if(c==='"'){
   if(quoted&&source[i+1]==='"'){value+='"';i++;}
   else quoted=!quoted;
  }else if(c===","&&!quoted){cells.push(value);value="";}
  else if((c==="\n"||c==="\r")&&!quoted){
   cells.push(value);if(cells.some(cell=>cell.trim()))rows.push(cells);
   cells=[];value="";if(c==="\r"&&source[i+1]==="\n")i++;
  }else value+=c;
 }
 if(quoted)throw new Error("Unclosed quoted CSV cell");
 cells.push(value);if(cells.some(cell=>cell.trim()))rows.push(cells);
 return rows;
}
function plainRtf(source:string){
 // Strip optional font/color tables and RTF control words without ever
 // interpreting embedded HTML or following RTF object/file references.
 return source.replace(/\{\\(?:fonttbl|colortbl|stylesheet|pict|object)[\s\S]*?\}/gi,"")
  .replace(/\\par[d]?\b\s?/gi,"\n")
  .replace(/\\tab\b\s?/gi,"\t")
  .replace(/\\'[0-9a-f]{2}/gi,"")
  .replace(/\\u-?\d+\??/gi,"")
  .replace(/\\[a-z]+-?\d*\s?/gi,"")
  .replace(/\\[{}\\]/g,"")
  .replace(/[{}]/g,"");
}
export function parseSkillCatalogImport(format:"CSV"|"RTF",content:string):SkillImportParsed{
 if(content.length>200_000)throw new Error("Catalog source exceeds 200KB");
 const raw=format==="CSV"?csvCells(content):
  plainRtf(content).split(/\r?\n/).filter(Boolean).map(row=>row.split(/[,\t]/));
 const rows:SkillImportRow[]=[],rejected:SkillImportRejected[]=[];
 const duplicates:{name:string;sourceLines:number[]}[]=[];
 const seen=new Map<string,number[]>();
 let first=true,truncated=false;
 for(let i=0;i<raw.length;i++){
  if(i>=1000){truncated=true;break;}
  const cells=raw[i]!.map(cell=>cell.trim());
  if(first && /^(name|skill|skill name)$/i.test(cells[0]??"")){
   first=false;continue;
  }
  first=false;
  const displayName=cells[0]?.replace(/\s+/g," ").trim()??"";
  const name=displayName.toLocaleLowerCase("en-IN");
  const category=cells[1]?.trim()||null;
  const synonyms=(cells[2]??"").split(/[|;]/).map(x=>x.trim())
   .filter(Boolean).slice(0,20);
  if(!name||name.length>200||name.includes("\u0000")||
     (category!==null&&category.length>50)||
     synonyms.some(x=>x.length>100)){
    rejected.push({line:i+1,reason:"Missing or oversized skill/category/synonym"});
    continue;
  }
  const sourceLines=seen.get(name);
  if(sourceLines){sourceLines.push(i+1);continue;}
  seen.set(name,[i+1]);
  rows.push({normalizedName:name,displayName,category,
    synonyms:[...new Set(synonyms.map(x=>x.toLocaleLowerCase("en-IN")))],
    sourceLine:i+1});
 }
 for(const [name,sourceLines] of seen)if(sourceLines.length>1)
  duplicates.push({name,sourceLines});
 return {rows,rejected,duplicates,truncated};
}
export function skillImportPreview<T extends string>(
 missing:readonly T[],extra:readonly T[],
){
 return {missing:missing.slice(0,100),extra:extra.slice(0,100),
  missingCount:missing.length,extraCount:extra.length,
  truncated:missing.length>100||extra.length>100};
}
