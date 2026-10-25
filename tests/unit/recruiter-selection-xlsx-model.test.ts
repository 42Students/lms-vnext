import {describe,it,expect} from "vitest";
import {deflateRawSync} from "node:zlib";
import {parseRecruiterSelectionXlsx} from "@/modules/placements/recruiter-selection-xlsx-model";
import {parseRecruiterSelectionCsv} from "@/modules/placements/recruiter-selection-csv-model";

/** Minimal standards-shaped stored ZIP fixture; no external spreadsheet library
 * or network access is needed for parser threat-model tests. */
function workbook(entries:Record<string,string>,method:0|8=8):Uint8Array{
 const local:Buffer[]=[];const central:Buffer[]=[];let offset=0;
 for(const [name,value] of Object.entries(entries)){
  const filename=Buffer.from(name);
  const source=Buffer.from(value);
  const payload=method===8?deflateRawSync(source):source;
  const l=Buffer.alloc(30);l.writeUInt32LE(0x04034b50,0);
  l.writeUInt16LE(20,4);l.writeUInt16LE(method,8);
  l.writeUInt32LE(payload.length,18);l.writeUInt32LE(source.length,22);
  l.writeUInt16LE(filename.length,26);
  local.push(l,filename,payload);
  const e=Buffer.alloc(46);e.writeUInt32LE(0x02014b50,0);e.writeUInt16LE(20,4);
  e.writeUInt16LE(20,6);e.writeUInt16LE(method,10);
  e.writeUInt32LE(payload.length,20);e.writeUInt32LE(source.length,24);e.writeUInt16LE(filename.length,28);
  e.writeUInt32LE(offset,42);central.push(e,filename);
  offset+=l.length+filename.length+payload.length;
 }
 const directory=Buffer.concat(central);
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(Object.keys(entries).length,8);
 end.writeUInt16LE(Object.keys(entries).length,10);
 end.writeUInt32LE(directory.length,12);
 end.writeUInt32LE(offset,16);
 return Buffer.concat([...local,directory,end]);
}
const id="11111111-1111-4111-8111-111111111111";
const sheet=(value:string)=>"<worksheet><sheetData><row r=\"1\"><c r=\"A1\" t=\"inlineStr\"><is><t>application_id</t></is></c></row><row r=\"2\"><c r=\"A2\" t=\"inlineStr\"><is><t>"+
 value+"</t></is></c></row></sheetData></worksheet>";
describe("bounded workbook selection import",()=>{
 it("extracts UUID from the first worksheet and retains eligible ID policy",()=>{
  const result=parseRecruiterSelectionXlsx(workbook({
   "xl/worksheets/sheet1.xml":sheet(id),
  }));
  expect(result.ok).toBe(true);
  if(result.ok){
   expect(parseRecruiterSelectionCsv(result.csv,new Set([id]))).toEqual({ok:true,ids:[id]});
   expect(parseRecruiterSelectionCsv(result.csv,new Set([])).ok).toBe(false);
  }
 });
 it("handles Excel-style deflated shared strings without treating them as permission",()=>{
  const xlsx=workbook({
   "xl/sharedStrings.xml":"<sst><si><t>application_id</t></si><si><t>"+id+"</t></si></sst>",
   "xl/worksheets/sheet1.xml":"<worksheet><sheetData>"+
    "<row r=\"1\"><c r=\"A1\" t=\"s\"><v>0</v></c></row>"+
    "<row r=\"2\"><c r=\"A2\" t=\"s\"><v>1</v></c></row>"+
    "</sheetData></worksheet>",
  });
  const outcome=parseRecruiterSelectionXlsx(xlsx);
  expect(outcome.ok).toBe(true);
  if(outcome.ok){
   expect(parseRecruiterSelectionCsv(outcome.csv,new Set([id]))).toEqual({ok:true,ids:[id]});
   expect(parseRecruiterSelectionCsv(outcome.csv,new Set([])).ok).toBe(false);
  }
 });
 it("rejects macros/formulas, invalid ids and malformed ZIP input",()=>{
  expect(parseRecruiterSelectionXlsx(new Uint8Array([1,2,3])).ok).toBe(false);
  expect(parseRecruiterSelectionXlsx(workbook({
   "xl/worksheets/sheet1.xml":sheet("../../../private"),
  })).ok).toBe(false);
  const withFormula=sheet(id).replace('<is><t>'+id+'</t></is>','<f>ROW()</f><v>1</v>');
  expect(parseRecruiterSelectionXlsx(workbook({
   "xl/worksheets/sheet1.xml":withFormula,
  })).ok).toBe(false);
 });
 it("rejects path traversal and oversized untrusted upload",()=>{
  expect(parseRecruiterSelectionXlsx(workbook({
   "../xl/worksheets/sheet1.xml":sheet(id),
  })).ok).toBe(false);
  expect(parseRecruiterSelectionXlsx(new Uint8Array(256001)).ok).toBe(false);
 });
});