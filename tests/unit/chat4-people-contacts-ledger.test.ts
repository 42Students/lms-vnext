import {describe,expect,it} from "vitest";
import {maskedPhone,maskedEmail,visibleContactDetails} from "@/modules/people/college-contacts-privacy";
import {
  collegeContactsQuerySchema,parseCollegeContactsSearchParams,collegeContactsHref,clearedCollegeContactsHref,
  contactRoleAudienceCompatible,contactAcademicFiltersCompatible,contactDateWindowValid,collegeContactLiteralPattern,
  collegeContactsTabHref,collegeContactsWithoutMemberHref,collegeContactFilterMessage,
  collegeContactsPageRange,activeCollegeContactFilterCount,
} from "@/modules/people/college-contacts-model";
import {
  collegeRoleDirectoryQuerySchema,parseCollegeRoleDirectorySearchParams,collegeRoleDirectoryHref,
  describeCollegeDirectoryContext,collegeDirectorySearchHint,assertCompatibleCollegeRoleDirectoryFilters,
  canonicalCollegeRoleDirectoryHref,selectedDirectoryValueNotListed,collegeRoleContactHref,
  collegeRoleDirectoryFilterMessage,roleDirectoryDateWindowValid,roleDirectoryIstDayStart,
  roleDirectoryNextIstDayStart,collegeRoleDirectoryHasActiveFilters,collegeRoleDirectoryPageRange,
} from "@/modules/people/college-role-directory-model";
import {collegePeopleDirectoryFilterSchema,parseCollegePeopleDirectorySearchParams,collegePeopleDirectoryHref,collegePeopleHasFilters} from "@/modules/people/college-people-directory-model";
import {collegePersonDetailQuerySchema,collegeStudentEnrollmentQuerySchema,recordedAttendanceSummary,CollegePersonNotFoundError} from "@/modules/people/college-person-detail-model";
import {collegeFacultyLifecycleSchema,facultyLifecycleConfirmation} from "@/modules/people/college-faculty-lifecycle-model";
import {studentCsvRequestSchema,tokenizeStudentCsv,parseStudentCsv,neutralStudentCsvCell,studentImportReportCsv} from "@/modules/people/college-student-csv-model";
const a="00000000-0000-4000-8000-000000000001";
const b="00000000-0000-4000-8000-000000000002";

describe("chat-4 college people/contact privacy and directory coverage",()=>{
  it("maskedPhone never leaks learner or other-user full number",()=>{
    expect(maskedPhone(null)).toBe("Not provided");
    expect(maskedPhone("")).toBe("Not provided");
    expect(maskedPhone("+91 98765 43210")).toBe("•••• 3210");
    expect(maskedPhone("123")).toBe("Not available");
  });
  it("maskedEmail keeps only first character and domain, handling malformed addresses",()=>{
    expect(maskedEmail(null)).toBe("Not provided");
    expect(maskedEmail("test@campus.edu")).toBe("t•••@campus.edu");
    expect(maskedEmail("@campus.edu")).toBe("Not available");
    expect(maskedEmail("test@")).toBe("Not available");
  });
  it("visibleContactDetails hides learner identity even in mixed role searches",()=>{
    expect(visibleContactDetails({email:"jane@college.edu",phone:"+919876543210",isLearner:true}))
      .toEqual({email:"j•••@college.edu",phone:"•••• 3210"});
    expect(visibleContactDetails({email:"faculty@college.edu",phone:null,isLearner:false}))
      .toEqual({email:"faculty@college.edu",phone:"Not provided"});
  });
  it("collegeContactsQuerySchema and parser reject duplicated, unknown, tenant forged, malformed page and alphabet",()=>{
    expect(collegeContactsQuerySchema.parse({})).toMatchObject({tab:"ALL",page:1,pageSize:10,status:"ACTIVE"});
    expect(parseCollegeContactsSearchParams({tab:"STUDENT",q:" Test "})).toMatchObject({tab:"STUDENT",q:"Test"});
    for(const bad of [{q:["a","b"]},{collegeId:a},{initial:"aa"},{page:"0"},{pageSize:"17"},
      {joinedFrom:"2099-06-01",joinedThrough:"2099-05-31"},{tab:"STUDENT",audience:"FACULTY_ONLY"},
      {teaching:"NONE",teachingRole:"PRIMARY"}])
      expect(()=>parseCollegeContactsSearchParams(bad)).toThrow();
  });
  it("contact compatibility helpers reject contradictory tabs, enrolment and date intervals",()=>{
    expect(contactRoleAudienceCompatible({tab:"STUDENT",audience:"FACULTY_ONLY"})).toBe(false);
    expect(contactRoleAudienceCompatible({tab:"FACULTY",audience:"LEARNER_ONLY"})).toBe(false);
    expect(contactRoleAudienceCompatible({tab:"ALL",audience:"DUAL"})).toBe(true);
    const academic={teaching:"ALL",teachingRole:"ALL",enrollment:"ALL",classPresence:"ALL"};
    expect(contactAcademicFiltersCompatible(academic)).toBe(true);
    expect(contactAcademicFiltersCompatible({...academic,enrollment:"NONE",sectionId:a})).toBe(false);
    expect(contactAcademicFiltersCompatible({...academic,classPresence:"NONE",sectionId:a})).toBe(false);
    expect(contactAcademicFiltersCompatible({...academic,teaching:"NONE",teachingRole:"PRIMARY"})).toBe(false);
    expect(contactDateWindowValid({joinedFrom:"2099-01-05",joinedThrough:"2099-01-01"})).toBe(false);
  });
  it("contactsHref, clear/tab/reset and membership exit preserve only intended filters",()=>{
    const f=collegeContactsQuerySchema.parse({tab:"STUDENT",q:"first & last",membershipId:a,page:4});
    expect(collegeContactsHref(f)).toContain("q=first+%26+last");
    expect(clearedCollegeContactsHref("STUDENT")).toBe("/college/contacts?tab=STUDENT");
    expect(collegeContactsTabHref({...f,audience:"LEARNER_ONLY"},"FACULTY")).not.toContain("audience=LEARNER_ONLY");
    expect(collegeContactsWithoutMemberHref(f)).not.toContain("membershipId=");
    expect(collegeContactsWithoutMemberHref(f)).not.toContain("page=");
  });
  it("contactLiteralPattern escapes SQL LIKE wildcards, not treating user %/_ as operators",()=>{
    expect(collegeContactLiteralPattern("ab%_\\")).toBe("%ab\\%\\_\\\\%");
    expect(collegeContactLiteralPattern("")).toBe("%%");
  });
  it("collegeContactFilterMessage maps approved errors but suppresses exception internals",()=>{
    expect(collegeContactFilterMessage(new Error("INVALID_CONTACT_DATE_WINDOW"))).toContain("Joined start date");
    expect(collegeContactFilterMessage(new Error("INVALID_CONTACT_ACADEMIC_COMBINATION"))).toContain("cannot be combined");
    expect(collegeContactFilterMessage(new Error("INVALID_CONTACT_ROLE_AUDIENCE"))).toContain("incompatible");
    expect(collegeContactFilterMessage(new Error("DB_PRIVATE_TOKEN"))).toBe("A contact filter is invalid. No contacts were loaded.");
  });
  it("contact result range and active facet count do not treat paging/tab as filters",()=>{
    expect(collegeContactsPageRange(1,20,0)).toEqual({first:0,last:0});
    expect(collegeContactsPageRange(2,20,25)).toEqual({first:21,last:25});
    expect(activeCollegeContactFilterCount(collegeContactsQuerySchema.parse({tab:"STUDENT",page:2,sort:"NEWEST"}))).toBe(0);
    expect(activeCollegeContactFilterCount(collegeContactsQuerySchema.parse({q:"alice",status:"SUSPENDED"}))).toBe(2);
  });
  it("role directory strict parser rejects cross-tenant foreign filters, duplicate and invalid date ranges",()=>{
    expect(collegeRoleDirectoryQuerySchema.parse({})).toMatchObject({status:"ALL",page:1,pageSize:25});
    expect(parseCollegeRoleDirectorySearchParams({q:"Person",page:"3"})).toMatchObject({q:"Person",page:3});
    for(const bad of [{organizationId:a},{page:["2"]},{page:"0"},{pageSize:"21"},
      {joinedFrom:"2099-05-20",joinedThrough:"2099-05-01"}])
      expect(()=>parseCollegeRoleDirectorySearchParams(bad)).toThrow();
  });
  it("role directory validates faculty versus learner fields and impossible combinations",()=>{
    const base=collegeRoleDirectoryQuerySchema.parse({});
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",base)).not.toThrow();
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",base)).not.toThrow();
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",{...base,enrollment:"ACTIVE"})).toThrow();
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("FACULTY",{...base,teaching:"NONE",teachingRole:"PRIMARY"})).toThrow();
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",{...base,facultyDepartmentId:a})).toThrow();
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",{...base,enrollment:"NONE",sectionId:a})).toThrow();
    expect(()=>assertCompatibleCollegeRoleDirectoryFilters("LEARNER",{...base,classPresence:"NONE",sectionId:a})).toThrow();
  });
  it("role directory contextual summary protects truthful missing enrollment and counts",()=>{
    const f={program:null,cohort:null,sections:[],activeTeachingAssignments:0};
    expect(describeCollegeDirectoryContext("LEARNER",f)).toBe("No active program/batch enrollment recorded");
    expect(describeCollegeDirectoryContext("FACULTY",f)).toBe("0 active course teaching assignments");
    expect(describeCollegeDirectoryContext("LEARNER",{...f,program:"B.Tech",cohort:"2026",sections:["B","A","A"]}))
      .toBe("B.Tech · 2026 · A, B");
    expect(collegeDirectorySearchHint("LEARNER")).toContain("roll");
    expect(collegeDirectorySearchHint("FACULTY")).toContain("department");
  });
  it("role directory URLs, selected values, paging and masked drilldown stay scoped",()=>{
    const f=collegeRoleDirectoryQuerySchema.parse({q:"Smith",page:4,teaching:"ASSIGNED"});
    expect(collegeRoleDirectoryHref("FACULTY",f)).toContain("page=4");
    expect(collegeRoleDirectoryHref("LEARNER",f)).not.toContain("teaching=ASSIGNED");
    expect(canonicalCollegeRoleDirectoryHref("FACULTY",f,2)).toContain("page=2");
    expect(canonicalCollegeRoleDirectoryHref("FACULTY",f,5)).toBeNull();
    expect(selectedDirectoryValueNotListed("missing",["present"])).toBe(true);
    expect(selectedDirectoryValueNotListed("present",["present"])).toBe(false);
    expect(collegeRoleContactHref(a)).toBe("/college/contacts/"+a);
    expect(()=>collegeRoleContactHref("foreign")).toThrow();
    expect(collegeRoleDirectoryHasActiveFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse({}))).toBe(false);
    expect(collegeRoleDirectoryHasActiveFilters("LEARNER",collegeRoleDirectoryQuerySchema.parse({q:"test"}))).toBe(true);
    expect(collegeRoleDirectoryPageRange(2,25,30)).toEqual({first:26,last:30});
  });
  it("role directory friendly errors never echo raw internal codes",()=>{
    expect(collegeRoleDirectoryFilterMessage(new Error("INVALID_ROLE_DIRECTORY_DATE_WINDOW"))).toContain("Joined-from date");
    expect(collegeRoleDirectoryFilterMessage(new Error("LEARNER_CLASS_FILTER_CONFLICT"))).toContain("cannot be combined");
    expect(collegeRoleDirectoryFilterMessage(new Error("FACULTY_SECTION_FILTER_UNSUPPORTED"))).toContain("other directory");
    expect(collegeRoleDirectoryFilterMessage(new Error("SQL_PASSWORD_EXPOSED"))).toBe("A directory filter is invalid. No people were loaded.");
    expect(roleDirectoryDateWindowValid({joinedFrom:"2099-01-02",joinedThrough:"2099-01-01"})).toBe(false);
    expect(roleDirectoryIstDayStart("2099-01-01").toISOString()).toBe("2098-12-31T18:30:00.000Z");
    expect(roleDirectoryNextIstDayStart("2099-01-01").toISOString()).toBe("2099-01-01T18:30:00.000Z");
  });
  it("college people directory rejects duplicate and foreign query, preserves role state",()=>{
    expect(collegePeopleDirectoryFilterSchema.parse({})).toMatchObject({role:"ALL",status:"ALL",page:1});
    expect(parseCollegePeopleDirectorySearchParams({q:"Dana",page:"2"})).toMatchObject({q:"Dana",page:2});
    expect(()=>parseCollegePeopleDirectorySearchParams({q:["A","B"]})).toThrow();
    expect(()=>parseCollegePeopleDirectorySearchParams({collegeId:a})).toThrow();
    expect(collegePeopleDirectoryHref(collegePeopleDirectoryFilterSchema.parse({q:"Dean",page:2}))).toBe("/college/people?q=Dean&page=2");
    expect(collegePeopleHasFilters(collegePeopleDirectoryFilterSchema.parse({page:9}))).toBe(false);
    expect(collegePeopleHasFilters(collegePeopleDirectoryFilterSchema.parse({q:"Dana"}))).toBe(true);
  });
  it("recordedAttendanceSummary denominators only include explicit statuses; zero is unknown",()=>{
    expect(recordedAttendanceSummary([])).toEqual({
      recordedMarkedEvents:0,presentOrLate:0,absent:0,excused:0,medical:0,recordedPercent:null});
    expect(recordedAttendanceSummary([{status:"PRESENT",count:3},{status:"LATE",count:1},
      {status:"ABSENT",count:2},{status:"MEDICAL",count:1}])).toEqual({
        recordedMarkedEvents:7,presentOrLate:4,absent:2,excused:0,medical:1,recordedPercent:57});
    expect(collegePersonDetailQuerySchema.safeParse({collegeId:a}).success).toBe(false);
    expect(collegeStudentEnrollmentQuerySchema.safeParse({status:"INVALID"}).success).toBe(false);
    expect(new CollegePersonNotFoundError().message).toBe("Person not found");
  });
  it("collegeFacultyLifecycleSchema requires expected active status, reason and explicit confirmation",()=>{
    const v={action:"DEACTIVATE",expectedStatus:"ACTIVE",reason:"Leaving college",confirm:true};
    expect(collegeFacultyLifecycleSchema.safeParse(v).success).toBe(true);
    expect(collegeFacultyLifecycleSchema.safeParse({...v,reason:"x"}).success).toBe(false);
    expect(collegeFacultyLifecycleSchema.safeParse({...v,confirm:false}).success).toBe(false);
    expect(collegeFacultyLifecycleSchema.safeParse({action:"REACTIVATE",expectedStatus:"SUSPENDED",confirm:true}).success).toBe(true);
    expect(collegeFacultyLifecycleSchema.safeParse({action:"REACTIVATE",expectedStatus:"ACTIVE",confirm:true}).success).toBe(false);
    expect(facultyLifecycleConfirmation("Dana","DEACTIVATE")).toContain("lose access");
    expect(facultyLifecycleConfirmation("Dana","REACTIVATE")).toContain("Reactivate Dana");
  });
  it("studentCsvRequestSchema blocks import without confirm, oversized files, wrong tenant controls",()=>{
    expect(studentCsvRequestSchema.safeParse({action:"PREVIEW",csv:"header"}).success).toBe(true);
    expect(studentCsvRequestSchema.safeParse({action:"IMPORT",csv:"header",confirm:false}).success).toBe(false);
    expect(studentCsvRequestSchema.safeParse({action:"IMPORT",csv:"header",confirm:true,collegeId:a}).success).toBe(false);
    expect(studentCsvRequestSchema.safeParse({action:"PREVIEW",csv:"x".repeat(1000001)}).success).toBe(false);
  });
  it("tokenizeStudentCsv keeps quoted commas, escaped quotes and rejects untrusted malformed quoting",()=>{
    expect(tokenizeStudentCsv('a,b\r\n"quoted, comma","x""y"\r\n')).toEqual([
      ["a","b"],["quoted, comma",'x"y']]);
    expect(()=>tokenizeStudentCsv('a,b\n"unclosed')).toThrow("UNTERMINATED_CSV_QUOTE");
    expect(()=>tokenizeStudentCsv('a,b\n"ok"x,5')).toThrow("INVALID_CSV_AFTER_QUOTE");
  });
  it("parseStudentCsv accepts legacy IST format, normalizes phone, blocks duplicate identity in same file",()=>{
    const header="First Name,Last Name,Roll Number,Mobile Number,Email";
    const input=header+"\nAnu,Rao,R-1,9876543210,anu@campus.edu\nJaya,Rao,R-2,9876543210,jaya@campus.edu";
    const parsed=parseStudentCsv(input,{programId:a,cohortId:b});
    expect(parsed.structuralErrors).toEqual([]);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0].data?.phoneE164).toBe("+919876543210");
    expect(parsed.entries[1].errors).toContain("DUPLICATE_PHONE_IN_FILE");
    expect(parseStudentCsv(input).structuralErrors).toContain("CHOOSE_PROGRAM_AND_BATCH");
    expect(parseStudentCsv("unknown\nwrong").structuralErrors).toContain("INVALID_CSV_HEADER");
    expect(parseStudentCsv(header+"\n").structuralErrors).toContain("CHOOSE_PROGRAM_AND_BATCH");
  });
  it("student CSV export neutralizes formula injection and spreadsheet quoting",()=>{
    expect(neutralStudentCsvCell(" =2+2")).toContain("' =2+2");
    expect(neutralStudentCsvCell('"quoted"')).toBe('"""quoted"""');
    const report=studentImportReportCsv([{row:2,status:"INVALID",detail:"=2+2"}]);
    expect(report).toContain("'=2+2");
    expect(report).toContain("row,status,detail,membershipId,enrollmentId");
  });
});
