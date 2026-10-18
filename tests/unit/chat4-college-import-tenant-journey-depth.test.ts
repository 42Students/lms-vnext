import { describe, expect, it } from "vitest";
import {
  collegeImportInputSchema,
  MAX_COLLEGE_IMPORT_ROWS,
  parseCollegeImportCsv,
} from "@/modules/colleges/bulk-import-model";
import { collegeBulkImportToast } from "@/modules/colleges/bulk-import-feedback-model";
import { canApplyConfirmedCollegeBulkImport } from "@/modules/colleges/bulk-import-confirmation-model";
import { superAdminTenantSetupSteps } from "@/modules/colleges/admin-tenant-setup-journey";
import {
  tenantSetupPresentation, tenantSetupQuerySchema,
} from "@/modules/colleges/admin-tenant-setup-model";
import { summarizeTenantSetupReadiness } from "@/modules/colleges/admin-tenant-setup-status";
import { istDayBounds, SUPER_ADMIN_TODAY_LABELS } from "@/modules/colleges/admin-today-attention-model";

const orgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const collegeId = "11111111-1111-4111-8111-111111111111";

describe("College bulk import and Super Admin tenant setup journey", () => {
  it("COL-IMPORT-PREVIEW-01 rejects header-only, duplicate headings and excess columns", () => {
    expect(() => parseCollegeImportCsv("name,code\n")).toThrow("Paste at least one college.");
    expect(() => parseCollegeImportCsv("name,name,code\nA,B,abc")).toThrow("Duplicate CSV heading.");
    expect(() => parseCollegeImportCsv("name,code\nA,abc,extra")).toThrow("too many columns");
    expect(() => parseCollegeImportCsv("name,code\nA,abc\nB,ABC")).toThrow("Duplicate college code");
    expect(() => parseCollegeImportCsv("name,code\n\"Unclosed")).toThrow("Unclosed CSV quote");
    expect(() => parseCollegeImportCsv("name,code\nA,abc\n".repeat(MAX_COLLEGE_IMPORT_ROWS + 2))).toThrow();
    expect(collegeImportInputSchema.safeParse({ organizationId: orgId, csv: "" }).success).toBe(false);
    expect(collegeImportInputSchema.safeParse({ organizationId: orgId, csv: "a", forgedCollegeId: collegeId }).success).toBe(false);
    expect(collegeImportInputSchema.safeParse({ organizationId: "foreign", csv: "name,code" }).success).toBe(false);
  });

  it("COL-IMPORT-PREVIEW-02 parses RFC-quoted commas and explicit column order without changing college identity", () => {
    const data = parseCollegeImportCsv('\uFEFFcode,name,city,state,country\r\niit-dharwad,"IIT, Dharwad",Dharwad,Karnataka,India\r\n');
    expect(data).toEqual([{
      line: 2, name: "IIT, Dharwad", code: "iit-dharwad",
      city: "Dharwad", state: "Karnataka", country: "India",
    }]);
    expect(parseCollegeImportCsv("College One,college-one")).toEqual([{
      line: 1, name: "College One", code: "college-one",
      city: null, state: null, country: null,
    }]);
  });

  it("COL-IMPORT-CONFIRM-01 requires a current validated CSV and matching selection confirmation", () => {
    const valid = {
      confirmed: true, inFlight: false, validRows: 2,
      validationError: "", organizationId: orgId,
      selectionVersion: 5, confirmationVersion: 5,
    };
    expect(canApplyConfirmedCollegeBulkImport(valid)).toBe(true);
    for (const invalid of [
      { confirmed:false }, { inFlight:true }, { validRows:0 },
      { validRows:MAX_COLLEGE_IMPORT_ROWS+1 }, { validRows:NaN },
      { validRows:Infinity }, { validRows:1.5 },
      { validationError:"Invalid CSV" }, { organizationId:"" },
      { selectionVersion:6 }, { confirmationVersion:4 },
    ]) {
      expect(canApplyConfirmedCollegeBulkImport({ ...valid, ...invalid })).toBe(false);
    }
  });

  it("COL-IMPORT-FEEDBACK-01 distinguishes a successful import from all-skipped and partial failures", () => {
    expect(collegeBulkImportToast([{status:"CREATED"}])).toEqual({
      title:"1 college created; 0 skipped; 0 failed",tone:"success",
    });
    expect(collegeBulkImportToast([{status:"CREATED"},{status:"SKIPPED"}])).toEqual({
      title:"1 college created; 1 skipped; 0 failed",tone:"success",
    });
    expect(collegeBulkImportToast([{status:"SKIPPED"}]).tone).toBe("error");
    expect(collegeBulkImportToast([{status:"CREATED"},{status:"FAILED"}]).tone).toBe("error");
    expect(collegeBulkImportToast([]).tone).toBe("error");
  });

  it("SA-COL-SETUP-01 disallows organization creation in selected-college scope and setup without a college", () => {
    expect(tenantSetupQuerySchema.parse({})).toEqual({tab:"create"});
    expect(tenantSetupQuerySchema.safeParse({tab:"delete"}).success).toBe(false);
    expect(tenantSetupQuerySchema.safeParse({tab:"create",collegeId}).success).toBe(false);
    expect(tenantSetupPresentation({
      tab:"create",selectedCollegeId:null,canCreateOrganization:true,canCreateCollege:true,
    })).toEqual({
      showCreate:true,showSetup:false,canCreateOrganization:true,
      canCreateCollege:true,requiresCollege:false,
    });
    const scoped = tenantSetupPresentation({
      tab:"create",selectedCollegeId:collegeId,canCreateOrganization:true,canCreateCollege:true,
    });
    expect(scoped.canCreateCollege).toBe(false);
    expect(scoped.canCreateOrganization).toBe(false);
    const setup = tenantSetupPresentation({
      tab:"setup",selectedCollegeId:null,canCreateOrganization:true,canCreateCollege:true,
    });
    expect(setup.requiresCollege).toBe(true);
    expect(setup.canCreateCollege).toBe(false);
  });

  it("SA-COL-SETUP-02 links tenant setup steps in a defined order without claiming runtime readiness", () => {
    const steps = superAdminTenantSetupSteps(collegeId);
    expect(steps.map(x=>x.id)).toEqual(["brand","login","host","academics","people","features","readiness"]);
    expect(steps[0].href).toBe("/admin/colleges/"+collegeId+"/branding");
    expect(steps[6].href).toBe("/admin/colleges/"+collegeId+"/readiness");
    expect(steps[5].href).toContain(encodeURIComponent(collegeId));
    expect(steps.every(x=>x.href.startsWith("/admin/"))).toBe(true);
    expect(steps.some(x=>x.title.toLowerCase().includes("ready to launch"))).toBe(false);
  });

  it("SA-COL-SETUP-03 distinguishes missing evidence, failures and persisted success from runtime launch approval", () => {
    expect(summarizeTenantSetupReadiness(null).label).toBe("Unknown");
    expect(summarizeTenantSetupReadiness({
      overall:"READY",counts:{passed:0,failed:0,unknown:0,total:0},
    }).label).toBe("Unknown");
    expect(summarizeTenantSetupReadiness({
      overall:"NOT_READY",counts:{passed:8,failed:1,unknown:1,total:10},
    }).label).toBe("Not ready");
    expect(summarizeTenantSetupReadiness({
      overall:"INCOMPLETE",counts:{passed:9,failed:0,unknown:1,total:10},
    }).label).toBe("Incomplete evidence");
    const persisted = summarizeTenantSetupReadiness({
      overall:"READY",counts:{passed:10,failed:0,unknown:0,total:10},
    });
    expect(persisted.label).toBe("Persisted checks pass");
    expect(persisted.detail).toContain("final launch approval are still separate gates");
  });

  it("SA-COL-TODAY-01 uses IST midnight and never moves attention windows with a server's local timezone", () => {
    const onIstBoundary = istDayBounds(new Date("2099-01-01T18:30:00Z"));
    expect(onIstBoundary.from.toISOString()).toBe("2099-01-01T18:30:00.000Z");
    expect(onIstBoundary.to.toISOString()).toBe("2099-01-02T18:30:00.000Z");
    expect(SUPER_ADMIN_TODAY_LABELS).toContain("Attendance not taken");
    expect(SUPER_ADMIN_TODAY_LABELS).toContain("Quizzes closing this week");
  });
});
