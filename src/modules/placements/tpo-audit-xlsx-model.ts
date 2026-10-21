import {Buffer} from "node:buffer";
import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "./tpo-audit-model";
import type {TpoAuditRow} from "./tpo-audit-service";

/** Minimal ZIP STORE OpenXML workbook writer. No third-party packages,
 * macros, external links, style injection or unsafe formula cells. */
const xml=(value:string)=>value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"")
 .replaceAll("&","&amp;").replaceAll("<","&lt;")
 .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const auditValue=(row:TpoAuditRow,column:string)=>{
 switch(column){
  case "Event":return formatTpoAuditEventType(row.eventType);
  case "About":return TPO_AUDIT_KIND_LABELS[row.kind];
  case "Detail":return [row.title,row.detail].filter(Boolean).join(" · ");
  case "Actor":return row.actorName;
  case "When":return new Intl.DateTimeFormat("en-IN",{
   timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
  }).format(new Date(row.occurredAt))+" IST";
  default:return "";
 }
};
function worksheet(rows:readonly TpoAuditRow[],columns:readonly string[]):string{
 const source=[columns.map(String),...rows.map(row=>columns.map(column=>auditValue(row,column)))];
 const body=source.map((values,rowIndex)=>{
  const cells=values.map((value,colIndex)=>{
   const cell=String.fromCharCode(65+colIndex)+(rowIndex+1);
   // Excel formula-looking values remain explicitly typed as inline strings.
   return '<c r="'+cell+'" t="inlineStr"><is><t xml:space="preserve">'+
    xml(value)+'</t></is></c>';
  }).join("");
  return '<row r="'+(rowIndex+1)+'">'+cells+'</row>';
 }).join("");
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<sheetData>'+body+'</sheetData></worksheet>';
}
function checksum(data:Buffer):number{
 let crc=0xFFFFFFFF;
 for(const byte of data){
  crc^=byte;
  for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);
 }
 return (crc^0xFFFFFFFF)>>>0;
}
function zip(entries:readonly {name:string;data:string}[]):Buffer{
 const locals:Buffer[]=[];
 const central:Buffer[]=[];
 let offset=0;
 for(const entry of entries){
  const name=Buffer.from(entry.name,"utf8"),data=Buffer.from(entry.data,"utf8");
  const crc=checksum(data);
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);
  local.writeUInt16LE(20,4); // minimum version 2.0
  local.writeUInt16LE(0,6); // no flags
  local.writeUInt16LE(0,8); // STORE; no compression
  local.writeUInt32LE(crc,14);
  local.writeUInt32LE(data.length,18);
  local.writeUInt32LE(data.length,22);
  local.writeUInt16LE(name.length,26);
  locals.push(local,name,data);
  const directory=Buffer.alloc(46);
  directory.writeUInt32LE(0x02014b50,0);
  directory.writeUInt16LE(20,4);
  directory.writeUInt16LE(20,6);
  directory.writeUInt16LE(0,8);
  directory.writeUInt16LE(0,10);
  directory.writeUInt32LE(crc,16);
  directory.writeUInt32LE(data.length,20);
  directory.writeUInt32LE(data.length,24);
  directory.writeUInt16LE(name.length,28);
  directory.writeUInt32LE(offset,42);
  central.push(directory,name);
  offset+=local.length+name.length+data.length;
 }
 const size=central.reduce((sum,part)=>sum+part.length,0);
 const eocd=Buffer.alloc(22);
 eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(entries.length,8);
 eocd.writeUInt16LE(entries.length,10);
 eocd.writeUInt32LE(size,12);
 eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,...central,eocd]);
}
export function tpoAuditXlsx(rows:readonly TpoAuditRow[],columns:readonly string[]):Buffer{
 if(rows.length>5000||columns.length===0||columns.length>5)
  throw new Error("AUDIT_XLSX_LIMIT");
 const rels="http://schemas.openxmlformats.org/package/2006/relationships";
 return zip([
  {name:"[Content_Types].xml",data:
   '<?xml version="1.0" encoding="UTF-8"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
   '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
   '</Types>'},
  {name:"_rels/.rels",data:'<?xml version="1.0" encoding="UTF-8"?>'+
   '<Relationships xmlns="'+rels+'">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
   '</Relationships>'},
  {name:"xl/workbook.xml",data:'<?xml version="1.0" encoding="UTF-8"?>'+
   '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'+
   ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
   '<sheets><sheet name="Audit" sheetId="1" r:id="rId1"/></sheets></workbook>'},
  {name:"xl/_rels/workbook.xml.rels",data:'<?xml version="1.0" encoding="UTF-8"?>'+
   '<Relationships xmlns="'+rels+'">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
   '</Relationships>'},
  {name:"xl/worksheets/sheet1.xml",data:worksheet(rows,columns)},
 ]);
}
