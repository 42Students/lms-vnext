import {describe,expect,it,vi} from "vitest";
import {
  trySaveReportCsv,type ReportDownloadPort,type ReportDownloadAnchor,
} from "@/components/placements/report-interactive-table-download-model";

function browser() {
  const anchor:ReportDownloadAnchor={
    href:"",download:"",click:vi.fn(),remove:vi.fn(),
  };
  const tasks:Array<()=>void>=[];
  const port:ReportDownloadPort={
    createUrl:vi.fn(()=>"blob:authorized-recruiter-report"),
    createAnchor:vi.fn(()=>anchor),
    appendAnchor:vi.fn(),
    revokeUrl:vi.fn(),
    defer:vi.fn(task=>{tasks.push(task);}),
  };
  return {anchor,tasks,port};
}
describe("UX-SPILL-HR-04: report browser export failure and cleanup",()=>{
 it("downloads exactly one sanitized current-page CSV and revokes after click, never before",()=>{
  const {anchor,port,tasks}=browser();
  expect(trySaveReportCsv('"Role"\r\n"Engineer"\r\n',"Q4 hiring",port)).toBe(true);
  expect(port.createUrl).toHaveBeenCalledWith('\uFEFF"Role"\r\n"Engineer"\r\n');
  expect(anchor.href).toBe("blob:authorized-recruiter-report");
  expect(anchor.download).toBe("report-q4-hiring.csv");
  expect(port.appendAnchor).toHaveBeenCalledWith(anchor);
  expect(anchor.click).toHaveBeenCalledOnce();
  expect(anchor.remove).toHaveBeenCalledOnce();
  expect(port.revokeUrl).not.toHaveBeenCalled();
  expect(tasks).toHaveLength(1);
  tasks[0]!();
  expect(port.revokeUrl).toHaveBeenCalledOnce();
 });
 it("reports a blocked Blob URL without claiming an export succeeded",()=>{
  const {anchor,port}=browser();
  vi.mocked(port.createUrl).mockImplementation(()=>{throw new Error("blocked object URL");});
  expect(trySaveReportCsv('"Name"\r\n',"Hiring",port)).toBe(false);
  expect(anchor.click).not.toHaveBeenCalled();
  expect(port.revokeUrl).not.toHaveBeenCalled();
 });
 it("always removes anchor and releases object URL when click throws",()=>{
  const {anchor,port,tasks}=browser();
  vi.mocked(anchor.click).mockImplementation(()=>{throw new Error("browser denied");});
  expect(trySaveReportCsv("some text","",port)).toBe(false);
  expect(anchor.download).toBe("report-export.csv");
  expect(anchor.remove).toHaveBeenCalledOnce();
  expect(tasks).toHaveLength(1);
  tasks[0]!();
  expect(port.revokeUrl).toHaveBeenCalledWith("blob:authorized-recruiter-report");
 });
 it("if scheduling cleanup is blocked, revokes immediately with no uncaught exception",()=>{
  const {port}=browser();
  vi.mocked(port.defer).mockImplementation(()=>{throw new Error("timer disabled");});
  expect(trySaveReportCsv("cells","Title",port)).toBe(true);
  expect(port.revokeUrl).toHaveBeenCalledOnce();
 });
 it("a revoked object URL failing cleanup does not fail a completed export",()=>{
  const {port,tasks}=browser();
  vi.mocked(port.revokeUrl).mockImplementation(()=>{throw new Error("already gone");});
  expect(trySaveReportCsv("cells","Title",port)).toBe(true);
  expect(()=>tasks[0]!()).not.toThrow();
 });
});
