import {inflateRawSync} from "node:zlib";
/** Bounded, read-only XLSX extraction. No macros, formulas, external links,
 * workbook URL resolution or names grant recruiter access. The caller must
 * recheck UUIDs against its server-authorized shortlist. */
type XlsxExtract={ok:true;csv:string}|{ok:false;error:string};
type ZipEntry={method:number;compressed:number;uncompressed:number;offset:number};
const fail=(error:string):XlsxExtract=>({ok:false,error});
const MAX_FILE=256_000;
const MAX_XML=512_000;
const MAX_ENTRIES=96;
const decoder=new TextDecoder("utf-8",{fatal:true});
function xmlValue(value:string){
 return value.replace(/&#(x[0-9a-fA-F]+|[0-9]+);|&(?:amp|lt|gt|quot|apos);/g,match=>{
  if(match==="&amp;")return "&";
  if(match==="&lt;")return "<";
  if(match==="&gt;")return ">";
  if(match==="&quot;")return '"';
  if(match==="&apos;")return "'";
  const hex=match.startsWith("&#x");
  const n=parseInt(match.slice(hex?3:2,-1),hex?16:10);
  return Number.isSafeInteger(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):"";
 });
}
function entries(input:Buffer):Map<string,ZipEntry>{
 const minimum=Math.max(0,input.length-65557);
 let eocd=-1;
 for(let i=input.length-22;i>=minimum;i--){
  if(input.readUInt32LE(i)===0x06054b50){eocd=i;break;}
 }
 if(eocd<0)throw Error("MISSING_ZIP_DIRECTORY");
 const count=input.readUInt16LE(eocd+10);
 const size=input.readUInt32LE(eocd+12);
 let offset=input.readUInt32LE(eocd+16);
 if(count>MAX_ENTRIES||count===0||size===0||
   offset===0xffffffff||count===0xffff||offset+size>eocd)
  throw Error("UNSUPPORTED_WORKBOOK");
 const map=new Map<string,ZipEntry>();
 for(let i=0;i<count;i++){
  if(offset+46>input.length||input.readUInt32LE(offset)!==0x02014b50)
   throw Error("INVALID_DIRECTORY");
  const flags=input.readUInt16LE(offset+8);
  const method=input.readUInt16LE(offset+10);
  const compressed=input.readUInt32LE(offset+20);
  const uncompressed=input.readUInt32LE(offset+24);
  const nameLen=input.readUInt16LE(offset+28);
  const extraLen=input.readUInt16LE(offset+30);
  const commentLen=input.readUInt16LE(offset+32);
  const entryOffset=input.readUInt32LE(offset+42);
  const stop=offset+46+nameLen+extraLen+commentLen;
  if(stop>input.length||nameLen===0||(flags&1)!==0||
   compressed===0xffffffff||uncompressed===0xffffffff)
   throw Error("INVALID_WORKBOOK_ENTRY");
  const name=decoder.decode(input.subarray(offset+46,offset+46+nameLen));
  if(name.startsWith("/")||name.includes("..")||name.includes("\\")||map.has(name))
   throw Error("INVALID_WORKBOOK_PATH");
  map.set(name,{method,compressed,uncompressed,offset:entryOffset});
  offset=stop;
 }
 return map;
}
function xml(input:Buffer,map:Map<string,ZipEntry>,name:string):string|null{
 const entry=map.get(name);
 if(!entry)return null;
 if(entry.uncompressed>MAX_XML||entry.compressed>MAX_FILE)
  throw Error("WORKBOOK_XML_TOO_LARGE");
 const header=entry.offset;
 if(header+30>input.length||input.readUInt32LE(header)!==0x04034b50)
  throw Error("INVALID_WORKBOOK_DATA");
 const start=header+30+input.readUInt16LE(header+26)+input.readUInt16LE(header+28);
 const end=start+entry.compressed;
 if(end>input.length||start<0)throw Error("INVALID_WORKBOOK_DATA");
 const zipped=input.subarray(start,end);
 let data:Buffer;
 if(entry.method===0)data=zipped;
 else if(entry.method===8)data=inflateRawSync(zipped,{maxOutputLength:MAX_XML});
 else throw Error("UNSUPPORTED_COMPRESSION");
 if(data.length!==entry.uncompressed)throw Error("INVALID_UNCOMPRESSED_SIZE");
 const value=decoder.decode(data);
 if(/<!DOCTYPE|<!ENTITY/i.test(value))throw Error("XML_EXTERNAL_ENTITIES");
 return value;
}
function sharedStrings(value:string|null):string[]{
 if(value===null)return [];
 const output:string[]=[];
 for(const section of value.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)){
  const text=[...section[1]!.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
   .map(v=>xmlValue(v[1]??"")).join("");
  output.push(text);
  if(output.length>10000)throw Error("TOO_MANY_SHARED_STRINGS");
 }
 return output;
}
function firstWorksheet(map:Map<string,ZipEntry>):string|null{
 if(map.has("xl/worksheets/sheet1.xml"))return "xl/worksheets/sheet1.xml";
 return [...map.keys()].filter(name=>/^xl\/worksheets\/sheet[0-9]+\.xml$/.test(name))
  .sort()[0]??null;
}
export function parseRecruiterSelectionXlsx(content:Uint8Array):XlsxExtract{
 if(content.byteLength>MAX_FILE)return fail("Excel file exceeds 250 KB.");
 if(content.byteLength<100)return fail("Invalid Excel workbook.");
 try{
  const buffer=Buffer.from(content);
  const directory=entries(buffer);
  const sheet=firstWorksheet(directory);
  if(!sheet)return fail("Workbook has no supported worksheet. Use the first Excel sheet.");
  const sheetXml=xml(buffer,directory,sheet);
  if(!sheetXml)return fail("Workbook worksheet is missing.");
  const strings=sharedStrings(xml(buffer,directory,"xl/sharedStrings.xml"));
  const rows:string[]=[];
  for(const row of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)){
   const cells=row[2]??"";
   const candidate=[...cells.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)]
    .find(cell=>/\br="A[0-9]+"/i.test(cell[1]??""));
   if(!candidate)continue;
   const attributes=candidate[1]??"";
   const body=candidate[2]??"";
   if(/<f(?:\s|>)/i.test(body))return fail("Formula cells are not allowed in application_id.");
   const direct=/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1];
   let value="";
   if(/\bt="s"/.test(attributes)){
    const number=Number(direct);
    if(!Number.isSafeInteger(number)||number<0||number>=strings.length)
     return fail("Workbook contains invalid shared string references.");
    value=strings[number]??"";
   }else if(/\bt="inlineStr"/.test(attributes)){
    value=[...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
     .map(item=>xmlValue(item[1]??"")).join("");
   }else value=xmlValue(direct??"");
   if(value.trim())rows.push(value.trim());
   if(rows.length>201)return fail("Select at most 200 applicants.");
  }
  if(rows.shift()?.toLowerCase()!=="application_id")
   return fail("First worksheet must have application_id in cell A1.");
  if(rows.length===0)return fail("The workbook contains no applicant IDs.");
  if(rows.some(id=>!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)))
   return fail("One or more application IDs are invalid. Keep IDs from the template.");
  return {ok:true,csv:"application_id\n"+rows.join("\n")+"\n"};
 }catch{
  return fail("Could not read the Excel workbook. Save as CSV (UTF-8) and retry.");
 }
}
