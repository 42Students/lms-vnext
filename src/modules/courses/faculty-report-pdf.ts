/** Dependency-free A4 PDF report. All rows must be authorized by the caller.
 * Keep output byte-for-byte ASCII: the browser's UTF-8 Blob serialization must
 * not invalidate the PDF cross-reference offsets. */
export type FacultyReportPdfInput = {
  kind: "assignment" | "quiz" | "attendance";
  title: string;
  subtitle: string;
  summary: readonly string[];
  sections: readonly { title: string; rows: readonly string[] }[];
  generatedAt?: Date;
};

const PAGE_WIDTH=595;
const PAGE_HEIGHT=842;
const MARGIN=42;
const RIGHT=PAGE_WIDTH-MARGIN;
const TEXT_WIDTH=RIGHT-MARGIN;
const TEAL="0.039 0.486 0.533";
const INK="0.090 0.125 0.200";
const MUTED="0.350 0.408 0.486";
const BORDER="0.851 0.890 0.925";

function printable(value:string):string{
 return value.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g," ")
  .replace(/\s+/g," ").trim();
}
/** Base-14 Helvetica renders Latin-1 using WinAnsi octal escapes. For other
 * scripts, /ActualText preserves exact original Unicode for copy/accessibility
 * even when the PDF viewer lacks an embeddable glyph. */
function pdfText(value:string):string{
 const special:Record<string,number>={
  "€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,
  "ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,
  "‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,
  "˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159,
 };
 let result="";
 for(const char of Array.from(printable(value))){
  if(char==="\\")result+="\\\\";
  else if(char==="(")result+="\\(";
  else if(char===")")result+="\\)";
  else{
   const code=char.codePointAt(0)!;
   const mapped=special[char]??code;
   result+=mapped>=32&&mapped<=126?char:
     mapped>=128&&mapped<=255?"\\"+mapped.toString(8).padStart(3,"0"):"?";
  }
 }
 return result;
}
function unicodeHex(value:string):string{
 let hex="FEFF";
 for(let i=0;i<value.length;i++)hex+=value.charCodeAt(i).toString(16).padStart(4,"0").toUpperCase();
 return hex;
}
function wrap(value:string,maxLength:number):string[]{
 const words=printable(value).split(/\s+/).filter(Boolean);
 if(!words.length)return [""];
 const lines:string[]=[];
 let line="";
 for(const word of words){
  if(!line){line=word;continue;}
  if(Array.from(line+" "+word).length<=maxLength){line+=" "+word;continue;}
  lines.push(line);line=word;
 }
 if(line)lines.push(line);
 return lines.flatMap(item=>{
  const chars=Array.from(item);
  if(chars.length<=maxLength)return [item];
  const pieces:string[]=[];
  for(let i=0;i<chars.length;i+=maxLength)pieces.push(chars.slice(i,i+maxLength).join(""));
  return pieces;
 });
}
function generatedDate(value:Date):string{
 const date=Number.isFinite(value.getTime())?value:new Date();
 const day=new Intl.DateTimeFormat("en-US",{
  timeZone:"Asia/Kolkata",month:"short",day:"numeric",year:"numeric",
 }).format(date);
 const clock=new Intl.DateTimeFormat("en-US",{
  timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
 }).format(date);
 return day+" at "+clock;
}

export function buildFacultyReportPdf(input:FacultyReportPdfInput):string{
 const pages:string[][]=[];
 let y=0;
 const page=()=>pages[pages.length-1]!;
 function textAt(value:string,x:number,atY:number,font:1|2,size:number,color:string){
  const source=printable(value);
  const escaped=pdfText(source);
  if(/[^\u0020-\u00ff]/u.test(source))
   page().push("/Span << /ActualText <"+unicodeHex(source)+"> >> BDC");
  page().push(color+" rg BT /F"+font+" "+size+" Tf "+x+" "+atY+" Td ("+escaped+") Tj ET");
  if(/[^\u0020-\u00ff]/u.test(source))page().push("EMC");
 }
 function rectangle(x:number,bottom:number,width:number,height:number,fill:string){
  page().push(fill+" rg "+x+" "+bottom+" "+width+" "+height+" re f");
 }
 function lineAt(atY:number){
  page().push(BORDER+" RG 0.6 w "+MARGIN+" "+atY+" m "+RIGHT+" "+atY+" l S");
 }
 function nextPage(){
  pages.push([]);
  y=PAGE_HEIGHT-48;
  rectangle(0,PAGE_HEIGHT-8,PAGE_WIDTH,8,TEAL);
  textAt("FACULTY "+input.kind.toUpperCase()+" REPORT",MARGIN,y,2,12,TEAL);
  y-=18;
  lineAt(y);
  y-=26;
 }
 function ensure(height:number){if(y-height<76)nextPage();}
 nextPage();
 for(const line of wrap(input.title,62)){
  ensure(27);textAt(line,MARGIN,y,2,19,INK);y-=25;
 }
 for(const line of wrap(input.subtitle,92)){
  ensure(17);textAt(line,MARGIN,y,1,10,MUTED);y-=15;
 }
 ensure(32);
 const date=generatedDate(input.generatedAt??new Date());
 textAt("Generated "+date,MARGIN,y-4,1,9,MUTED);
 y-=34;
 if(input.summary.length){
  ensure(28);textAt("Summary",MARGIN,y,2,12,INK);y-=16;
  for(let i=0;i<input.summary.length;i+=3){
   ensure(60);
   const batch=input.summary.slice(i,i+3);
   const gap=9,width=(TEXT_WIDTH-2*gap)/3;
   batch.forEach((value,index)=>{
    const x=MARGIN+index*(width+gap);
    rectangle(x,y-46,width,50,"0.949 0.974 0.979");
    rectangle(x,y-46,3,50,TEAL);
    wrap(value,28).slice(0,3).forEach((line,row)=>
     textAt(line,x+11,y-15-row*12,row===0?2:1,row===0?10:9,row===0?INK:MUTED));
   });
   y-=61;
  }
 }
 for(const section of input.sections){
  ensure(62);
  y-=8;
  rectangle(MARGIN,y-27,TEXT_WIDTH,31,"0.936 0.955 0.970");
  for(const [index,heading] of wrap(section.title,73).slice(0,2).entries())
   textAt(heading,MARGIN+12,y-14-index*11,2,index===0?11:9,INK);
  y-=34;
  if(!section.rows.length){
   ensure(34);
   textAt("No records",MARGIN+12,y-18,1,10,MUTED);y-=36;
   continue;
  }
  for(let i=0;i<section.rows.length;i++){
   const wrapped=wrap(section.rows[i]!,90);
   for(let at=0;at<wrapped.length;){
    const available=Math.max(1,Math.floor((y-76-12)/13));
    if(available<1){nextPage();continue;}
    const lines=wrapped.slice(at,at+available);
    const height=Math.max(26,lines.length*13+10);
    ensure(height);
    if(i%2===0)rectangle(MARGIN,y-height,TEXT_WIDTH,height,"0.977 0.985 0.991");
    lines.forEach((part,line)=>textAt(part,MARGIN+12,y-17-line*13,1,9,INK));
    y-=height;
    lineAt(y);
    at+=lines.length;
   }
  }
 }
 if(!input.sections.length){
  ensure(30);textAt("No report sections available",MARGIN,y,1,10,MUTED);
 }
 for(let i=0;i<pages.length;i++){
  pages[i]!.push(BORDER+" RG 0.6 w "+MARGIN+" 57 m "+RIGHT+" 57 l S");
  pages[i]!.push(MUTED+" rg BT /F1 8 Tf "+MARGIN+" 39 Td (Page "+(i+1)+" of "+pages.length+") Tj ET");
 }
 const objects:string[]=[];
 const reserve=()=>{objects.push("");return objects.length};
 const set=(id:number,value:string)=>{objects[id-1]=value};
 const catalogId=reserve(),pagesId=reserve(),normalFontId=reserve(),boldFontId=reserve();
 set(normalFontId,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
 set(boldFontId,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
 const pageIds:number[]=[];
 for(const ops of pages){
  const stream=ops.join("\n")+"\n";
  const contentId=reserve();
  set(contentId,"<< /Length "+stream.length+" >>\nstream\n"+stream+"endstream");
  const pageId=reserve();
  set(pageId,"<< /Type /Page /Parent "+pagesId+
   " 0 R /MediaBox [0 0 "+PAGE_WIDTH+" "+PAGE_HEIGHT+
   "] /Resources << /Font << /F1 "+normalFontId+
   " 0 R /F2 "+boldFontId+" 0 R >> >> /Contents "+contentId+" 0 R >>");
  pageIds.push(pageId);
 }
 set(pagesId,"<< /Type /Pages /Kids ["+pageIds.map(id=>id+" 0 R").join(" ")+
  "] /Count "+pageIds.length+" >>");
 set(catalogId,"<< /Type /Catalog /Pages "+pagesId+" 0 R >>");
 let pdf="%PDF-1.4\n";
 const offsets:number[]=[0];
 objects.forEach((object,index)=>{
  offsets.push(pdf.length);
  pdf+=(index+1)+" 0 obj\n"+object+"\nendobj\n";
 });
 const xref=pdf.length;
 pdf+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
 for(const offset of offsets.slice(1))pdf+=String(offset).padStart(10,"0")+" 00000 n \n";
 pdf+="trailer\n<< /Size "+(objects.length+1)+" /Root "+catalogId+
  " 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";
 return pdf;
}
