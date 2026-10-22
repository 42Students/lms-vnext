import {describe,expect,it} from "vitest";
import {
 auditFindingHistoryActionLabel,
 classifyAuditFindingSourceEvent,
} from "@/modules/bug-tracker/audit-finding-source-event-model";

describe("G2-2-001-066 independent audit import provenance",()=>{
 it("distinguishes immutable importer, agent update, tamper and deletion events",()=>{
  expect(classifyAuditFindingSourceEvent("IMPORT","ACCEPTED")).toBe("imported");
  expect(classifyAuditFindingSourceEvent("UPDATE","ACCEPTED")).toBe("agent_update");
  expect(classifyAuditFindingSourceEvent("UPDATE","TAMPERED")).toBe("file_changed");
  expect(classifyAuditFindingSourceEvent("DELETE","DELETED")).toBe("file_deleted");
  expect(classifyAuditFindingSourceEvent("IMPORT","REFUSED")).toBeNull();
 });
 it("renders source-event labels only for recognized persisted provenance",()=>{
  expect(auditFindingHistoryActionLabel("COMMENT",{sourceEvent:"file_changed"})).toBe("File changed");
  expect(auditFindingHistoryActionLabel("COMMENT",{sourceEvent:"file_deleted"})).toBe("File deleted");
  expect(auditFindingHistoryActionLabel("COMMENT",{sourceEvent:"agent_update"})).toBe("Agent update");
  expect(auditFindingHistoryActionLabel("COMMENT",{sourceEvent:"imported"})).toBe("Reported");
  expect(auditFindingHistoryActionLabel("COMMENT",{sourceEvent:"unexpected"})).toBe("COMMENT");
  expect(auditFindingHistoryActionLabel("STATUS",null)).toBe("STATUS");
 });
});
