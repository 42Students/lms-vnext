import {inflateRawSync} from "node:zlib";

/** Read just the first worksheet and shared strings; no macro or formula execution. */
function unpackXlsx(bytes:Buffer):Map<string,string>{
 if(bytes.length>3_000_000)throw Error("Spreadsheet must be smaller than 3 MB.");
 const entries=new Map<string,string>();
 let eocd=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(bytes.readUInt32LE(i)===0x06054b50){eocd=i;break;}
 }
 if(eocd<0)throw Error("Not a valid Excel workbook.");
 const count=bytes.readUInt16LE(eocd+10),start=bytes.readUInt32LE(eocd+16);
 if(count>300)throw Error("Workbook contains too many ZIP entries.");
 let offset=start;
 for(let i=0;i<count;i++){
  if(offset+46>bytes.length||bytes.readUInt32LE(offset)!==0x02014b50)throw Error("Invalid workbook directory.");
  const compression=bytes.readUInt16LE(offset+10);
  const packed=bytes.readUInt32LE(offset+20),raw=bytes.readUInt32LE(offset+24);
  const nameLen=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32);
  const local=bytes.readUInt32LE(offset+42);
  const name=bytes.subarray(offset+46,offset+46+nameLen).toString("utf8");
  offset+=46+nameLen+extra+comment;
  if(!/^xl\/(sharedStrings\.xml|worksheets\/sheet1\.xml)$/.test(name))continue;
  if(raw>12_000_000||packed>3_000_000||local+30>bytes.length||bytes.readUInt32LE(local)!==0x04034b50)
   throw Error("Workbook sheet is too large or invalid.");
  const pos=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
  if(pos+packed>bytes.length)throw Error("Workbook entry is incomplete.");
  const zip=bytes.subarray(pos,pos+packed);
  const unzipped=compression===0?zip:compression===8?inflateRawSync(zip,{maxOutputLength:12_000_000}):null;
  if(!unzipped||unzipped.length>12_000_000)throw Error("Unsupported workbook compression.");
  entries.set(name,unzipped.toString("utf8"));
 }
 if(!entries.has("xl/worksheets/sheet1.xml"))throw Error("First worksheet was not found.");
 return entries;
}
function decodeXml(s:string){return s.replace(/&#x([a-f0-9]+);|&#([0-9]+);|&amp;|&lt;|&gt;|&quot;|&apos;/gi,
 value=>{
  if(value.startsWith("&#x"))return String.fromCodePoint(parseInt(value.slice(3,-1),16));
  if(value.startsWith("&#"))return String.fromCodePoint(parseInt(value.slice(2,-1),10));
  return ({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'"} as Record<string,string>)[value]??value;
 });}
function cellIndex(ref:string){let index=0;for(const ch of ref.toUpperCase()){
 if(ch<"A"||ch>"Z")break;index=index*26+ch.charCodeAt(0)-64;
 }return index-1;}
export function parseResultXlsx(bytes:Buffer):string[][]{
 const files=unpackXlsx(bytes);
 const shared:string[]=[];const strings=files.get("xl/sharedStrings.xml")??"";
 for(const item of strings.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)){
  shared.push([...item[1]!.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x=>decodeXml(x[1]??"")).join(""));
 }
 const sheet=files.get("xl/worksheets/sheet1.xml")!;
 const rows:string[][]=[];
 let expectedSheetRow=1;
 for(const rowMatch of sheet.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)){
  const observed=/\br="([0-9]+)"/.exec(rowMatch[1]??"");
  const rowNumber=observed?Number(observed[1]):expectedSheetRow;
  if(!Number.isSafeInteger(rowNumber)||rowNumber!==expectedSheetRow)
   throw Error("Worksheet contains skipped, reordered or duplicate row numbers. Keep a continuous header and student list.");
  expectedSheetRow++;
  if(rows.length>=1001)throw Error("Import at most 1,000 worksheet rows.");
  const values:string[]=[];
  for(const c of rowMatch[2]!.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){
   const attr=c[1]??"",body=c[2]??"";
   if(/<f(?:\s|>|\/)/i.test(body))
    throw Error("Formula cells are not accepted for company results. Paste values first.");
   const ref=/\br="([^"]+)"/.exec(attr)?.[1]??"";
   const position=cellIndex(ref);
   if(position<0||position>39)throw Error("Each worksheet cell must have a valid column from A to AN.");
   const type=/\bt="([^"]+)"/.exec(attr)?.[1];
   const inline=[...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x=>decodeXml(x[1]??"")).join("");
   const raw=/<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1]??"";
   values[position]=type==="s"?shared[Number(raw)]??"":type==="inlineStr"?inline:decodeXml(raw);
  }
  if(!values.some(value=>value!==undefined&&value.trim()!==""))
   throw Error("A blank worksheet row would shift the learner-to-result mapping. Remove it before import.");
  rows.push(values.map(x=>x??""));
 }
 return rows;
}
