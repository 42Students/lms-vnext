import {deflateRawSync} from "node:zlib";
import type {TpoStudentRow} from "./tpo-students-model";
/** SpreadsheetML workbook with native inline strings and a minimal RFC 1951 ZIP container.
 * No dynamic formula elements, external links, macros or untrusted ZIP entry names. */
export const TPO_STUDENT_EXCEL_COLUMNS={
 student:["Student",(row:TpoStudentRow)=>row.displayName],number:["Student number",(row:TpoStudentRow)=>row.rollNumber??row.registrationNumber],
 batch:["Batch",(row:TpoStudentRow)=>row.cohortName],branch:["Branch",(row:TpoStudentRow)=>row.branchName],
 stage:["Stage",(row:TpoStudentRow)=>row.journeyState],profile:["Profile",(row:TpoStudentRow)=>row.verification.status],
 cgpa:["CGPA",(row:TpoStudentRow)=>row.cgpa],tenth:["10th %",(row:TpoStudentRow)=>row.tenthPct],
 twelfth:["12th %",(row:TpoStudentRow)=>row.twelfthPct],diploma:["Diploma %",(row:TpoStudentRow)=>row.diplomaPct],
 ug:["UG %",(row:TpoStudentRow)=>row.ugPct],pg:["PG % (profile entry)",(row:TpoStudentRow)=>row.profileFacts?.pgPercentage],
 backlogs:["Active backlogs",(row:TpoStudentRow)=>row.activeBacklogs],
 offers:["Offers",(row:TpoStudentRow)=>row.offerCount],applications:["Applications",(row:TpoStudentRow)=>row.applicationCount],
 best:["Best so far",(row:TpoStudentRow)=>row.bestSoFar],
 afterCollege:["After college",(row:TpoStudentRow)=>row.registrationChoice],
 gender:["Gender",(row:TpoStudentRow)=>row.profileFacts?.gender],
 skills:["Skills",(row:TpoStudentRow)=>row.profileFacts?.skills],
 projects:["Projects",(row:TpoStudentRow)=>row.profileFacts?.projects],
 certification:["Certifications",(row:TpoStudentRow)=>row.profileFacts?.certifications],
 experience:["Experience entries",(row:TpoStudentRow)=>row.profileFacts?.experiences],
 resume:["Resume",(row:TpoStudentRow)=>row.profileFacts?.resume?"Provided":"Not provided"],
 marksVerified:["Marks verified",(row:TpoStudentRow)=>row.marksVerified?"Verified":"Not verified"],
 passingYear:["Passing year",(row:TpoStudentRow)=>row.passingYear],
 email:["Email (export only)",(row:TpoStudentRow)=>row.email],
 eligibilityReason:["Eligibility reason (staff only)",(row:TpoStudentRow)=>row.participationReason],
} satisfies Record<string,readonly [string,(row:TpoStudentRow)=>string|number|boolean|null|undefined]>;
export type TpoExcelColumn=keyof typeof TPO_STUDENT_EXCEL_COLUMNS;
export function selectTpoExcelColumns(selected:readonly string[]):TpoExcelColumn[]{
 const safe=selected.filter((value):value is TpoExcelColumn=>Object.hasOwn(TPO_STUDENT_EXCEL_COLUMNS,value));
 return [...new Set(["batch","branch",...(safe.length?safe:["student","number","stage","cgpa","best","offers"]),"email","eligibilityReason"] as TpoExcelColumn[])];
}
function xml(value:unknown){
 const text=String(value??"").slice(0,1500).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,"");
 return text.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
}
const encoder=new TextEncoder();
const uint16=(n:number)=>[n&255,n>>>8&255];
const uint32=(n:number)=>[n&255,n>>>8&255,n>>>16&255,n>>>24&255];
function crc(bytes:Uint8Array):number{
 let x=0xFFFFFFFF;
 for(const c of bytes){x^=c;for(let i=0;i<8;i++)x=x&1?(x>>>1)^0xEDB88320:x>>>1;}
 return (x^0xFFFFFFFF)>>>0;
}
function zip(parts:readonly {name:string;content:string}[]):Uint8Array{
 const local:Uint8Array[]=[],central:Uint8Array[]=[];
 let offset=0;
 for(const part of parts){
  const name=encoder.encode(part.name),raw=encoder.encode(part.content),packed=new Uint8Array(deflateRawSync(raw,{level:6}));
  const checksum=crc(raw);
  const header=Uint8Array.from([...uint32(0x04034B50),...uint16(20),...uint16(0x0800),...uint16(8),
   ...uint16(0),...uint16(0),...uint32(checksum),...uint32(packed.length),...uint32(raw.length),
   ...uint16(name.length),...uint16(0)]);
  local.push(header,name,packed);
  central.push(Uint8Array.from([...uint32(0x02014B50),...uint16(20),...uint16(20),...uint16(0x0800),...uint16(8),
   ...uint16(0),...uint16(0),...uint32(checksum),...uint32(packed.length),...uint32(raw.length),
   ...uint16(name.length),...uint16(0),...uint16(0),...uint16(0),...uint16(0),...uint32(0),...uint32(offset)]),name);
  offset+=header.length+name.length+packed.length;
 }
 const centralSize=central.reduce((n,row)=>n+row.length,0);
 const end=Uint8Array.from([...uint32(0x06054B50),...uint16(0),...uint16(0),...uint16(parts.length),...uint16(parts.length),
  ...uint32(centralSize),...uint32(offset),...uint16(0)]);
 const output=new Uint8Array(offset+centralSize+end.length);
 let cursor=0;for(const part of [...local,...central,end]){output.set(part,cursor);cursor+=part.length;}
 return output;
}
export function exportTpoStudentsXlsx(rows:readonly TpoStudentRow[],selectedColumns:readonly string[],viewName:string):Uint8Array{
 if(rows.length>5000)throw Error("Export limit is 5,000 scoped students");
 const cols=selectTpoExcelColumns(selectedColumns);
 const line=(values:readonly unknown[],number:number,italic=false)=>
  `<row r="${number}">${values.map((value,index)=>`<c r="${String.fromCharCode(65+index%26)}${number}" t="inlineStr"${italic?' s="1"':""}><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join("")}</row>`;
 const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${line(["How this list was made: "+viewName],1,true)}${line(cols.map(key=>TPO_STUDENT_EXCEL_COLUMNS[key][0]),2)}${rows.map((row,i)=>line(cols.map(key=>TPO_STUDENT_EXCEL_COLUMNS[key][1](row)),i+3)).join("")}</sheetData></worksheet>`;
 const parts=[
  {name:"[Content_Types].xml",content:'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
  {name:"_rels/.rels",content:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
  {name:"xl/workbook.xml",content:'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Students" sheetId="1" r:id="rId1"/></sheets></workbook>'},
  {name:"xl/_rels/workbook.xml.rels",content:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
  {name:"xl/styles.xml",content:'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/></font><font><i/><sz val="11"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>'},
  {name:"xl/worksheets/sheet1.xml",content:sheet},
 ];
 return zip(parts);
}
