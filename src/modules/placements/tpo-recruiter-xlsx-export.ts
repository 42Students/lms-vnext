/**
 * Minimal Office Open XML spreadsheet writer for Engage's current table.
 * Every value is a literal inline string, so untrusted recruiter text cannot
 * execute formulas when the file opens in Excel.
 */
function xml(s:string){
 return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&apos;")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"");
}
function column(n:number){
 let out="";for(n++;n;n=Math.floor((n-1)/26))
  out=String.fromCharCode(65+(n-1)%26)+out;
 return out;
}
function sheet(rows:readonly (readonly string[])[]){
 return '<?xml version="1.0" encoding="UTF-8"?>'+
 '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+
 rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>
  '<c r="'+column(j)+(i+1)+'" s="'+(i===0?1:0)+
  '" t="inlineStr"><is><t xml:space="preserve">'+xml(v)+
  '</t></is></c>').join("")+'</row>').join("")+
 '</sheetData></worksheet>';
}
function crc32(data:Uint8Array){
 let crc=0xffffffff;
 for(const b of data){
  crc^=b;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function zip(files:readonly {path:string;text:string}[]){
 const encoder=new TextEncoder(),chunks:Uint8Array[]=[];
 const entries:{name:Uint8Array;data:Uint8Array;crc:number;offset:number}[]=[];
 let size=0;
 const write16=(v:DataView,p:number,n:number)=>v.setUint16(p,n,true);
 const write32=(v:DataView,p:number,n:number)=>v.setUint32(p,n>>>0,true);
 for(const file of files){
  const name=encoder.encode(file.path),data=encoder.encode(file.text),crc=crc32(data);
  const head=new Uint8Array(30+name.length),view=new DataView(head.buffer);
  write32(view,0,0x04034b50);write16(view,4,20);
  write32(view,14,crc);write32(view,18,data.length);write32(view,22,data.length);
  write16(view,26,name.length);head.set(name,30);
  entries.push({name,data,crc,offset:size});chunks.push(head,data);
  size+=head.length+data.length;
 }
 const directoryStart=size;
 for(const e of entries){
  const head=new Uint8Array(46+e.name.length),view=new DataView(head.buffer);
  write32(view,0,0x02014b50);write16(view,4,20);write16(view,6,20);
  write32(view,16,e.crc);write32(view,20,e.data.length);write32(view,24,e.data.length);
  write16(view,28,e.name.length);write32(view,42,e.offset);head.set(e.name,46);
  chunks.push(head);size+=head.length;
 }
 const footer=new Uint8Array(22),view=new DataView(footer.buffer);
 write32(view,0,0x06054b50);write16(view,8,entries.length);write16(view,10,entries.length);
 write32(view,12,size-directoryStart);write32(view,16,directoryStart);
 chunks.push(footer);size+=footer.length;
 const output=new Uint8Array(size);let start=0;
 for(const chunk of chunks){output.set(chunk,start);start+=chunk.length;}
 return output.buffer;
}
export function recruiterLeadsXlsx(headers:readonly string[],values:readonly (readonly string[])[]){
 const files=[
  {path:"[Content_Types].xml",text:'<?xml version="1.0"?>'+
   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
   '<Default Extension="xml" ContentType="application/xml"/>'+
   '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
   '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
   '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
   '</Types>'},
  {path:"_rels/.rels",text:'<?xml version="1.0"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
   '</Relationships>'},
  {path:"xl/workbook.xml",text:'<?xml version="1.0"?>'+
   '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
   '<sheets><sheet name="Recruiters" sheetId="1" r:id="rId1"/></sheets></workbook>'},
  {path:"xl/_rels/workbook.xml.rels",text:'<?xml version="1.0"?>'+
   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
   '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
   '</Relationships>'},
  {path:"xl/styles.xml",text:'<?xml version="1.0"?>'+
   '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
   '<fonts count="2"><font><sz val="11"/></font><font><b/><sz val="11"/></font></fonts>'+
   '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'+
   '<borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs>'+
   '<cellXfs count="2"><xf fontId="0" fillId="0" borderId="0" xfId="0"/>'+
   '<xf fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>'},
  {path:"xl/worksheets/sheet1.xml",text:sheet([headers,...values])},
 ];
 return new Blob([zip(files)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
