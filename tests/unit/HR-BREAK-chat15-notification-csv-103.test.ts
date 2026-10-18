import {describe,expect,it} from "vitest";
import {buildHrInboxCsv,HR_INBOX_CSV_CAP}
 from "@/modules/placements/hr-inbox-csv-model";
const item={id:"notice",jobId:"job",title:"Engineering drive",
 label:"Drive published",createdAt:new Date("2099-05-01T18:30:00Z"),unread:true};
describe("HR-NOTIFICATIONS-CSV-103 employer notification data export",()=>{
 it("does not crash on a corrupt historical received timestamp or invent a date",()=>{
  const csv=buildHrInboxCsv([{...item,createdAt:new Date(Number.NaN)}],1).csv;
  expect(csv).toContain("Date unavailable");
  expect(csv).not.toContain("Invalid Date");
 });
 it("ignores negative, fractional, infinite or NaN authorized totals",()=>{
  for(const total of [Number.NaN,Infinity,-1,1.5]){
   const result=buildHrInboxCsv([item],total);
   expect(result.omitted).toBe(0);
   expect(result.csv).not.toContain("NaN");
   expect(result.csv).not.toContain("Export capped");
  }
 });
 it("caps to the exact authorized 200 rows and indicates the extra records",()=>{
  const rows=Array.from({length:HR_INBOX_CSV_CAP+2},(_,i)=>({...item,id:"notice-"+i}));
  const result=buildHrInboxCsv(rows,rows.length);
  expect(result.exported).toBe(HR_INBOX_CSV_CAP);
  expect(result.omitted).toBe(2);
  expect(result.csv).toContain("Additional authorized notifications omitted");
 });
 it("escapes spreadsheet formulas and retains read versus unread meaning",()=>{
  const rows=[{...item,title:" =HYPERLINK(1,2)"},{...item,id:"read",unread:false}];
  const result=buildHrInboxCsv(rows,2);
  expect(result.csv).toContain("' =HYPERLINK");
  expect(result.csv).toContain('"Yes"');
  expect(result.csv).toContain('"No"');
 });
});