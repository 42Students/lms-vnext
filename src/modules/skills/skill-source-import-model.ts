import {z} from "zod";
import {normalizedImportedSkillName} from "./legacy-skill-import-model";

const rowSchema=z.strictObject({
 name:z.string().trim().min(1).max(200),
 displayName:z.string().trim().min(1).max(200),
 category:z.string().trim().max(50).nullable(),
});
export type SkillImportRow=z.infer<typeof rowSchema>;
export const skillImportRequestSchema=z.strictObject({
 format:z.enum(["CSV","RTF"]),
 source:z.string().min(1).max(200000),
 dryRun:z.boolean().default(true),
}).refine(value=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value.source),{
 message:"Source contains binary or control characters",path:["source"],
});
function csvCells(line:string):string[]{
 const parts:string[]=[];
 let word="",quoted=false;
 for(let i=0;i<line.length;i++){
  const char=line[i];
  if(char==='"'){
   if(quoted&&line[i+1]==='"'){word+='"';i++;}
   else quoted=!quoted;
  }else if(char===","&&!quoted){parts.push(word);word="";}
  else word+=char;
 }
 if(quoted)throw new Error("Unterminated CSV quoted field");
 parts.push(word);
 return parts;
}
function sourceLines(format:"CSV"|"RTF",source:string):string[]{
 if(format==="CSV")return source.replace(/^\uFEFF/,"").split(/\r?\n/);
 if(!source.trimStart().startsWith("{\\rtf"))throw new Error("Invalid RTF source");
 const text=source
  .replace(/\\par\b/g,"\n").replace(/\\line\b/g,"\n")
  .replace(/\\'[0-9a-fA-F]{2}/g," ")
  .replace(/\\u-?\d+\??/g," ")
  .replace(/\\[a-zA-Z]+-?\d* ?/g," ")
  .replace(/\\[{}\\]/g," ").replace(/[{}]/g,"");
 return text.split(/\r?\n/);
}
export function parseLegacySkillSource(format:"CSV"|"RTF",source:string){
 const lines=sourceLines(format,source);
 const rows:SkillImportRow[]=[],invalid:Array<{line:number;reason:string}>=[];
 const seen=new Set<string>();
 let duplicates=0,headers=false;
 for(let n=0;n<lines.length;n++){
  const line=lines[n].trim();
  if(!line)continue;
  if(n>20000)throw new Error("Source contains too many rows");
  const cols=format==="CSV"?csvCells(line):[line];
  if(format==="CSV"&&!headers&&/^(name|skill|skill_name)$/i.test(cols[0]?.trim()??"")){
   headers=true;continue;
  }
  const displayName=(cols[1]?.trim()||cols[0]?.trim()||"").replace(/\s+/g," ");
  const name=normalizedImportedSkillName(cols[0]??"");
  const validated=rowSchema.safeParse({name,displayName,category:cols[2]?.trim()||null});
  if(!validated.success){
   if(invalid.length<100)invalid.push({line:n+1,reason:"Invalid skill name, display text or category"});
   continue;
  }
  if(seen.has(validated.data.name)){duplicates++;continue;}
  seen.add(validated.data.name);rows.push(validated.data);
  if(rows.length>10000)throw new Error("Import limited to 10000 distinct skills");
 }
 if(!rows.length)throw new Error("No valid skills in source");
 return {rows,invalid,duplicates,sourceLines:lines.length};
}
