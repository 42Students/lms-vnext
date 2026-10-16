/**
 * Parse a single-sheet .xlsx into CSV for the existing validated import path.
 * The ZIP central directory is used rather than trusting local headers (Excel
 * commonly uses data descriptors). Size bounds prevent oversized decompression.
 */
const text=new TextDecoder();
const MAX_FILE=10_000_000;
const MAX_ENTRY=5_000_000;
function decodeXml(source:string):Document{
 if(/<!DOCTYPE|<!ENTITY/i.test(source))throw new Error("XLSX_UNSAFE_XML");
 const document=new DOMParser().parseFromString(source,"application/xml");
 if(document.querySelector("parsererror"))throw new Error("XLSX_INVALID_XML");
 return document;
}
function columnIndex(reference:string):number{
 const letters=reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase()??"";
 let index=0;
 for(const letter of letters)index=index*26+letter.charCodeAt(0)-64;
 return index-1;
}
async function unzipSheets(buffer:ArrayBuffer){
 if(buffer.byteLength>MAX_FILE)throw new Error("XLSX_TOO_LARGE");
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 const u16=(at:number)=>view.getUint16(at,true);
 const u32=(at:number)=>view.getUint32(at,true);
 let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--){
  if(u32(p)===0x06054b50){end=p;break;}
 }
 if(end<0)throw new Error("XLSX_INVALID_ZIP");
 const files=new Map<string,string>();
 let pointer=u32(end+16),total=0;
 for(let i=0;i<u16(end+10);i++){
  if(pointer+46>bytes.length||u32(pointer)!==0x02014b50)throw new Error("XLSX_INVALID_ZIP");
  const method=u16(pointer+10),compressed=u32(pointer+20),size=u32(pointer+24);
  const nameSize=u16(pointer+28),extras=u16(pointer+30),comment=u16(pointer+32);
  const offset=u32(pointer+42);
  const name=text.decode(bytes.slice(pointer+46,pointer+46+nameSize));
  pointer+=46+nameSize+extras+comment;
  if(!name.startsWith("xl/")||!(name==="xl/sharedStrings.xml"||/^xl\/worksheets\/sheet\d+\.xml$/.test(name)))continue;
  if(size>MAX_ENTRY||compressed>MAX_FILE||total+size>MAX_FILE)throw new Error("XLSX_TOO_LARGE");
  if(offset+30>bytes.length||u32(offset)!==0x04034b50)throw new Error("XLSX_INVALID_ZIP");
  const dataStart=offset+30+u16(offset+26)+u16(offset+28);
  if(dataStart+compressed>bytes.length)throw new Error("XLSX_INVALID_ZIP");
  const packed=bytes.slice(dataStart,dataStart+compressed);
  let output:Uint8Array;
  if(method===0)output=packed;
  else if(method===8){
   if(typeof DecompressionStream==="undefined")throw new Error("XLSX_UNSUPPORTED_COMPRESSION");
   const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
   output=new Uint8Array(await new Response(stream).arrayBuffer());
  }else throw new Error("XLSX_UNSUPPORTED_COMPRESSION");
  if(output.length!==size||output.length>MAX_ENTRY)throw new Error("XLSX_INVALID_ZIP");
  total+=output.length;
  files.set(name,text.decode(output));
 }
 return files;
}
export async function recruiterXlsxToCsv(file:File):Promise<string>{
 const files=await unzipSheets(await file.arrayBuffer());
 const sheet=files.get("xl/worksheets/sheet1.xml");
 if(!sheet)throw new Error("XLSX_NO_FIRST_SHEET");
 const shared=files.get("xl/sharedStrings.xml");
 const strings=shared?[...decodeXml(shared).getElementsByTagName("si")].map(si=>si.textContent??""):[];
 const document=decodeXml(sheet);
 const rows:string[][]=[];
 for(const row of document.getElementsByTagName("row")){
  const cells:string[]=[];
  for(const cell of row.getElementsByTagName("c")){
   const index=columnIndex(cell.getAttribute("r")??"");
   if(index<0||index>100)throw new Error("XLSX_TOO_MANY_COLUMNS");
   const value=cell.getElementsByTagName("v")[0]?.textContent??"";
   cells[index]=cell.getAttribute("t")==="s"?strings[Number(value)]??"":
    cell.getAttribute("t")==="inlineStr"?
     cell.getElementsByTagName("is")[0]?.textContent??"":value;
  }
  rows.push(Array.from({length:cells.length},(_,i)=>cells[i]??""));
  if(rows.length>5001)throw new Error("CSV_ROW_LIMIT_EXCEEDED");
 }
 if(!rows.length)throw new Error("CSV_EMPTY");
 return rows.map(row=>row.map(value=>'"'+value.replace(/"/g,'""')+'"').join(",")).join("\r\n")+"\r\n";
}
