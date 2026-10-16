import { describe, expect, it } from "vitest";
import {
  istDateOnly,
  istNaiveToUtcIso,
  maskEmail,
  maskLegacyRef,
  maskName,
  maskPhone,
  nsritId,
  roundHalfUp,
  sourceHash,
  stableStringify,
  uuidV5,
} from "../../scripts/migrate/nsrit/common";
import {
  junkEmailReasons,
  junkNameReasons,
  junkReasonsFor,
} from "../../scripts/migrate/nsrit/filters";
import {
  buildLearnerProfileDocument,
  codeSlug,
  mapCohortStatus,
  mapFacultyType,
  mapRoomType,
  normalizeEmail,
  normalizePhoneE164,
  parseAcademicYear,
  parseCalendarDate,
  periodForAcademicYear,
  toIntRoundHalfUp,
  uniqueCode,
} from "../../scripts/migrate/nsrit/mappers";
import {
  ALWAYS_DENIED_COLUMNS,
  buildSelectSql,
  parseJsonLines,
  scrubSecrets,
  selectableColumns,
  snapshotDigest,
  type TableSpec,
} from "../../scripts/migrate/nsrit/export-lib";
import {
  GuardError,
  assertApplyAllowed,
  assertStatementAllowed,
  assertTargetAllowed,
  safeErrorMessage,
} from "../../scripts/migrate/nsrit/guards";
import { learnerProfileDocumentSchema } from "../../src/modules/people/profile-validation";

describe("deterministic ids", () => {
  it("matches the RFC 4122 v5 reference vector", () => {
    expect(uuidV5("python.org", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(
      "886313e1-3b8a-5372-9b90-0c9aee199e5d",
    );
  });

  it("derives the same id for the same legacy row and distinguishes targets", () => {
    expect(nsritId("users", "learner", 7)).toBe(nsritId("users", "learner", "7"));
    expect(nsritId("users", "learner", 7)).not.toBe(nsritId("users", "faculty", 7));
    expect(nsritId("users", "learner", 7)).not.toBe(nsritId("college_memberships", "learner", 7));
    expect(nsritId("users", "learner", 7)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("hashes independent of key order and changes with content", () => {
    expect(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe(
      stableStringify({ a: [2, { c: 2, d: 1 }], b: 1 }),
    );
    expect(sourceHash({ a: 1 })).toBe(sourceHash({ a: 1 }));
    expect(sourceHash({ a: 1 })).not.toBe(sourceHash({ a: 2 }));
    expect(sourceHash({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("naive IST to UTC", () => {
  it("subtracts 5h30m", () => {
    expect(istNaiveToUtcIso("2026-05-11 09:55:23.441406")).toBe("2026-05-11T04:25:23.441Z");
    expect(istNaiveToUtcIso("2026-05-11T10:00:00")).toBe("2026-05-11T04:30:00.000Z");
  });
  it("crosses the date boundary", () => {
    expect(istNaiveToUtcIso("2026-01-01 03:00:00")).toBe("2025-12-31T21:30:00.000Z");
    expect(istNaiveToUtcIso("2026-03-01 00:00:00")).toBe("2026-02-28T18:30:00.000Z");
  });
  it("treats a bare date as IST midnight and rejects junk", () => {
    expect(istNaiveToUtcIso("2026-07-04")).toBe("2026-07-03T18:30:00.000Z");
    expect(istNaiveToUtcIso("2026-02-31 10:00:00")).toBeNull();
    expect(istNaiveToUtcIso("")).toBeNull();
    expect(istNaiveToUtcIso(null)).toBeNull();
    expect(istNaiveToUtcIso("not a date")).toBeNull();
  });
  it("keeps IST calendar dates for date-only fields", () => {
    expect(istDateOnly("2024-06-20 00:00:00.000000")).toBe("2024-06-20");
    expect(istDateOnly("2024-13-40")).toBeNull();
  });
});

describe("masking", () => {
  it("never returns the original text", () => {
    expect(maskName("Asha Verma")).toBe("A*** V***");
    expect(maskName("")).toBe("-");
    expect(maskPhone("+919876543210")).toBe("**********10");
    expect(maskPhone("12")).toBe("-");
    expect(maskEmail("Asha.Verma@College.EDU")).toBe("***@college.edu");
    expect(maskEmail("nope")).toBe("-");
    expect(maskLegacyRef("learner", 12)).toBe("learner#12");
    expect(maskName("Asha Verma")).not.toContain("sha");
  });
  it("rounds half up", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(2.4)).toBe(2);
    expect(roundHalfUp(0.5)).toBe(1);
    expect(toIntRoundHalfUp("7.50")).toBe(8);
    const counter = { rounded: 0 };
    expect(toIntRoundHalfUp(3, counter)).toBe(3);
    expect(toIntRoundHalfUp("3.5", counter)).toBe(4);
    expect(toIntRoundHalfUp("", counter)).toBeNull();
    expect(counter.rounded).toBe(1);
  });
});

describe("real-data-only filter", () => {
  it("flags test and probe names", () => {
    expect(junkNameReasons("E2E Dept 1789049339866")).toContain("NAME_E2E");
    expect(junkNameReasons("AIML Testing")).toContain("NAME_TESTWORD");
    expect(junkNameReasons("[Elective] Java · SMOKE PE")).toContain("NAME_TESTWORD");
    expect(junkNameReasons("QA Test Department")).toContain("NAME_TESTWORD");
    expect(junkNameReasons("E2E <script>window.__xss=true</script>")).toContain("NAME_MARKUP");
    expect(junkNameReasons("A".repeat(50))).toContain("NAME_REPEATED");
    expect(junkNameReasons("x".repeat(130).replace(/x/g, (_m, i) => String.fromCharCode(97 + (i % 26))))).toContain("NAME_TOO_LONG");
    expect(junkNameReasons("ABCD")).toContain("NAME_PLACEHOLDER");
    expect(junkNameReasons("John Doe")).toContain("NAME_PLACEHOLDER");
  });
  it("keeps real academic names", () => {
    for (const name of [
      "MERN",
      "Department of Science",
      "Computer Science and Engineering",
      "Artificial Intelligence and Machine learning",
      "B.Tech CSE",
      "2027 CRT Prime",
      "Contest Preparation",
      "Latest Trends Lab",
      "Priya Qadir",
    ]) {
      expect(junkNameReasons(name)).toEqual([]);
    }
  });
  it("flags reserved and test e-mail identities only", () => {
    expect(junkEmailReasons("someone@example.com")).toContain("EMAIL_DOMAIN");
    expect(junkEmailReasons("someone@testing.com")).toContain("EMAIL_DOMAIN");
    expect(junkEmailReasons("someone@student.com")).toContain("EMAIL_DOMAIN");
    expect(junkEmailReasons("a@b.test")).toContain("EMAIL_DOMAIN");
    expect(junkEmailReasons("qa.lead@company.com")).toContain("EMAIL_LOCAL");
    expect(junkEmailReasons("test12@company.com")).toContain("EMAIL_LOCAL");
    expect(junkEmailReasons("qasim@company.com")).toEqual([]);
    expect(junkEmailReasons("student1@nsrit.edu.in")).toEqual([]);
    expect(junkEmailReasons("person@gmail.com")).toEqual([]);
    expect(junkEmailReasons(null)).toEqual([]);
  });
  it("combines soft delete, name and e-mail rules in a stable order", () => {
    expect(
      junkReasonsFor({ names: ["E2E x"], email: "a@example.com", isDeleted: 1 }),
    ).toEqual(["SOFT_DELETED", "NAME_E2E", "EMAIL_DOMAIN"]);
    expect(junkReasonsFor({ names: ["Real Person"], email: "r@nsrit.edu.in", isDeleted: 0 })).toEqual([]);
    expect(junkReasonsFor({ isDeleted: null })).toEqual([]);
  });
});

describe("value mappers", () => {
  it("normalises Indian phone numbers to E.164", () => {
    expect(normalizePhoneE164("9876543210")).toBe("+919876543210");
    expect(normalizePhoneE164("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhoneE164("09876543210")).toBe("+919876543210");
    expect(normalizePhoneE164("919876543210")).toBe("+919876543210");
    expect(normalizePhoneE164("1234567890")).toBeNull();
    expect(normalizePhoneE164("98765")).toBeNull();
    expect(normalizePhoneE164(null)).toBeNull();
  });
  it("normalises e-mail", () => {
    expect(normalizeEmail("  Mixed.Case@College.EDU ")).toBe("mixed.case@college.edu");
    expect(normalizeEmail("no-at-sign")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });
  it("maps faculty ordinals as the owner decided", () => {
    expect(mapFacultyType(4)).toMatchObject({ typeName: "ADMIN", roles: ["FACULTY", "COLLEGE_ADMIN"], employmentType: null });
    expect(mapFacultyType("13")).toMatchObject({ typeName: "MENTOR", roles: ["FACULTY", "MENTOR"] });
    expect(mapFacultyType(14)).toMatchObject({ typeName: "TPO", roles: ["FACULTY", "TPO"] });
    expect(mapFacultyType(0)).toMatchObject({ roles: ["FACULTY"], employmentType: "Permanent", academicTitle: null });
    expect(mapFacultyType(1)).toMatchObject({ employmentType: "Guest" });
    expect(mapFacultyType(8)).toMatchObject({ employmentType: null, academicTitle: "Professor" });
    expect(mapFacultyType(11)).toMatchObject({ academicTitle: "Lecturer" });
    expect(mapFacultyType(null)).toEqual({ typeName: null, roles: ["FACULTY"], employmentType: null, academicTitle: null });
    expect(mapFacultyType(99).typeName).toBeNull();
  });
  it("maps room types, cohort statuses and academic years", () => {
    expect(mapRoomType(0)).toBe("CLASSROOM");
    expect(mapRoomType("2")).toBe("LAB");
    expect(mapRoomType(9)).toBeNull();
    expect(mapRoomType(null)).toBeNull();
    expect(mapCohortStatus("active")).toBe("ACTIVE");
    expect(mapCohortStatus("weird")).toBeNull();
    expect(parseAcademicYear("2026-27")).toBe(2026);
    expect(parseAcademicYear("2026-2027")).toBe(2026);
    expect(parseAcademicYear("2026/27")).toBe(2026);
    expect(parseAcademicYear("2026-29")).toBeNull();
    expect(parseAcademicYear("")).toBeNull();
  });
  it("builds a July-June academic period and never emits CLOSED", () => {
    const today = new Date("2026-10-16T00:00:00Z");
    expect(periodForAcademicYear(2025, today)).toMatchObject({ code: "AY2025-26", startDate: "2025-07-01", endDate: "2026-06-30", status: "ACTIVE" });
    expect(periodForAcademicYear(2026, today).status).toBe("ACTIVE");
    expect(periodForAcademicYear(2027, today).status).toBe("PLANNED");
  });
  it("makes bounded unique codes", () => {
    expect(codeSlug("B.Tech CSE")).toBe("B-TECH-CSE");
    expect(codeSlug("???")).toBe("X");
    expect(uniqueCode("MERN", 8)).toBe("MERN-8");
    expect(uniqueCode("A".repeat(100), 12).length).toBeLessThanOrEqual(64);
    expect(uniqueCode("A".repeat(100), 12).endsWith("-12")).toBe(true);
  });
  it("parses profile dates", () => {
    expect(parseCalendarDate("2001-02-03")).toBe("2001-02-03");
    expect(parseCalendarDate("03/02/2001")).toBe("2001-02-03");
    expect(parseCalendarDate("31/02/2001")).toBe("");
    expect(parseCalendarDate("garbage")).toBe("");
  });
});

describe("learner profile document", () => {
  const legacy = {
    id: 42,
    description: "Synthetic bio",
    gender: "female",
    blood_group: "o +",
    dob: "15/08/2004",
    current_address: "1 Test Street",
    current_city: "Synthetic City",
    pincode: "500001",
    permanent_address: "2 Other Street",
    permanent_city: "Elsewhere",
    linkedin: "linkedin.com/in/synthetic",
    github: "javascript:alert(1)",
    contact_mail: "synthetic@example.org",
    skills: [{ skill: "TypeScript", proficiency: "advanced" }, { skill: "" }],
    hobbies: [{ hobby: "Chess" }, { hobby: "chess" }],
    languages: [{ language: "Telugu", proficiency: "Native" }],
    certifications: [{ name: "Cert", authority: "Org", certificationDate: "2025-01-02" }],
    projects: [{ name: "Proj", skillsUsed: "a, b", githubUrl: "https://example.org/x" }],
    achievements: [{ title: "Won", year: "2024" }],
    extracurricular: [{ activity: "Club", year: "20x4" }],
    experiences: [],
    identity: { aadhaarNumber: "123412341234", panNumber: "ABCDE1234F" },
  };
  const qualification = [
    { education_type: "UG", program: "B.Tech", institution_name: "Synthetic Univ", start_year: "2022", end_year: "2026", grading_type: "CGPA", grade: "8.1", max_grade: "10", exam_details: { rank: 5, nested: { x: 1 } } },
  ];

  it("conforms to the strict profile schema and never carries identity numbers", () => {
    const stats = { droppedItems: 0, droppedFields: 0 };
    const doc = buildLearnerProfileDocument(legacy, qualification, stats);
    const parsed = learnerProfileDocumentSchema.safeParse(doc);
    expect(parsed.success).toBe(true);
    expect(JSON.stringify(doc)).not.toContain("123412341234");
    expect(JSON.stringify(doc)).not.toContain("ABCDE1234F");
    expect(doc.identity).toEqual({ aadhaarNumber: "", panNumber: "" });
    expect((doc.socialProfiles as Record<string, string>).githubUrl).toBe("");
    expect((doc.socialProfiles as Record<string, string>).linkedinUrl).toBe("https://linkedin.com/in/synthetic");
    expect((doc.personalDetails as Record<string, string>).dateOfBirth).toBe("2004-08-15");
    expect((doc.personalDetails as Record<string, string>).gender).toBe("Female");
    expect((doc.personalDetails as Record<string, string>).bloodGroup).toBe("O+");
    expect(stats.droppedItems).toBe(1); // the empty skill
    expect((doc.education as unknown[]).length).toBe(1);
    expect((doc.education as { examDetails: unknown }[])[0].examDetails).toEqual({ rank: 5 });
  });

  it("is deterministic (same input, same item ids)", () => {
    const a = buildLearnerProfileDocument(legacy, qualification);
    const b = buildLearnerProfileDocument(legacy, qualification);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const other = buildLearnerProfileDocument({ ...legacy, id: 43 }, qualification);
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(a));
  });
});

describe("export column policy", () => {
  const spec: TableSpec = { table: "learner", where: "college_id = 6", scope: "test", deny: ["token_version"] };
  it("withholds identity, photos, tokens and OTP-like columns", () => {
    const columns = [
      "id", "first_name", "identity", "photo", "token_version", "otp", "email_otp", "refresh_token", "password_hash", "api_key", "resume_url", "pincode",
    ].map((name) => ({ name, dataType: "varchar" }));
    const { kept, denied } = selectableColumns(columns, spec);
    expect(kept.map((c) => c.name)).toEqual(["id", "first_name", "resume_url", "pincode"]);
    expect(denied).toEqual(
      expect.arrayContaining(["identity", "photo", "token_version", "otp", "email_otp", "refresh_token", "password_hash", "api_key"]),
    );
    expect(ALWAYS_DENIED_COLUMNS.has("identity")).toBe(true);
  });
  it("honours an explicit column whitelist", () => {
    const only: TableSpec = { table: "company", where: "1=1", scope: "t", only: ["id", "name"] };
    const { kept } = selectableColumns(
      ["id", "name", "contact_email", "internal_notes"].map((name) => ({ name, dataType: "varchar" })),
      only,
    );
    expect(kept.map((c) => c.name)).toEqual(["id", "name"]);
  });
  it("builds a read-only JSON_OBJECT select with typed casts", () => {
    const sql = buildSelectSql(spec, [
      { name: "id", dataType: "int" },
      { name: "is_active", dataType: "bit" },
      { name: "amount", dataType: "decimal" },
      { name: "skills", dataType: "json" },
    ]);
    expect(sql).toContain("JSON_OBJECT(");
    expect(sql).toContain("(`is_active`+0)");
    expect(sql).toContain("CAST(`amount` AS CHAR)");
    expect(sql).toMatch(/^SELECT /);
    expect(sql).not.toMatch(/\b(insert|update|delete|drop|alter)\b/i);
  });
  it("scrubs secret JSON keys recursively and counts them", () => {
    const counter = { removed: 0 };
    const out = scrubSecrets({ ok: 1, refreshToken: "x", nested: [{ otp: "1", keep: 2 }], aadhaarNumber: "9" }, counter);
    expect(out).toEqual({ ok: 1, nested: [{ keep: 2 }] });
    expect(counter.removed).toBe(3);
  });
  it("parses one JSON object per line, including CRLF and empty lines", () => {
    const rows = parseJsonLines('{"id":1,"a":"x\\ny"}\r\n\r\n{"id":2}\n');
    expect(rows).toEqual([{ id: 1, a: "x\ny" }, { id: 2 }]);
    expect(() => parseJsonLines("[1]")).toThrow();
  });
  it("digests manifests independent of key order", () => {
    const t = {
      b: { file: "b", rows: 1, sha256: "2", scope: "", columns: [], deniedColumns: [], scrubbedJsonKeys: 0 },
      a: { file: "a", rows: 2, sha256: "1", scope: "", columns: [], deniedColumns: [], scrubbedJsonKeys: 0 },
    };
    expect(snapshotDigest(t)).toBe(snapshotDigest({ a: t.a, b: t.b }));
  });
});

describe("loader guards", () => {
  const env = {};
  it("accepts only loopback databases by default", () => {
    expect(assertTargetAllowed("postgresql://u:p@127.0.0.1:54329/lms_vnext_test", { allowRemoteDev: false, env }).local).toBe(true);
    expect(assertTargetAllowed("postgresql://u:p@localhost/lms_vnext", { allowRemoteDev: false, env }).local).toBe(true);
    expect(() => assertTargetAllowed("postgresql://u:p@10.0.0.5/lms_vnext", { allowRemoteDev: false, env })).toThrow(GuardError);
    expect(() => assertTargetAllowed(undefined, { allowRemoteDev: false, env })).toThrow(GuardError);
    expect(() => assertTargetAllowed("mysql://u:p@127.0.0.1/x", { allowRemoteDev: false, env })).toThrow(GuardError);
    expect(() => assertTargetAllowed("postgresql://u:p@127.0.0.1/x?host=10.0.0.5", { allowRemoteDev: false, env })).toThrow(GuardError);
  });
  it("needs both the flag and the env acknowledgement for a remote dev target, and never production", () => {
    const remote = "postgresql://u:p@10.0.0.5/lms_vnext";
    expect(() => assertTargetAllowed(remote, { allowRemoteDev: true, env })).toThrow(/acknowledgement/);
    const ack = { ALLOW_NSRIT_REMOTE_DEV: "I_ACCEPT_DEV_ONLY_NSRIT" };
    expect(assertTargetAllowed(remote, { allowRemoteDev: true, env: ack }).local).toBe(false);
    expect(() => assertTargetAllowed("postgresql://u:p@10.0.0.5/lms_prod", { allowRemoteDev: true, env: ack })).toThrow(/production/);
  });
  it("requires an explicit acknowledgement to apply", () => {
    expect(() => assertApplyAllowed({})).toThrow(GuardError);
    expect(() => assertApplyAllowed({ ALLOW_NSRIT_IMPORT: "I_ACCEPT" })).not.toThrow();
  });
  it("allows only allowlisted writes and never messaging tables", () => {
    expect(() => assertStatementAllowed("SELECT 1")).not.toThrow();
    expect(() => assertStatementAllowed("  INSERT INTO users (id) VALUES ($1)")).not.toThrow();
    expect(() => assertStatementAllowed('UPDATE "college_memberships" SET status = $1')).not.toThrow();
    expect(() => assertStatementAllowed("DELETE FROM legacy_id_map WHERE 1=1")).not.toThrow();
    for (const table of ["in_app_notifications", "outbound_messages", "general_notification_outbox", "activity_events", "tenant_domains"]) {
      expect(() => assertStatementAllowed(`INSERT INTO ${table} (id) VALUES (1)`)).toThrow(/not allowed/);
    }
    expect(() => assertStatementAllowed("DROP TABLE users")).toThrow(GuardError);
    expect(() => assertStatementAllowed("TRUNCATE users")).toThrow(GuardError);
  });
  it("does not leak row values through error text", () => {
    const err = Object.assign(new Error('invalid input syntax for type uuid: "+919876543210"'), { code: "22P02" });
    expect(safeErrorMessage(err)).not.toContain("9876543210");
    const dup = Object.assign(new Error("duplicate key value violates unique constraint"), {
      code: "23505",
      constraint: "users_phone_e164_key",
      table: "users",
      detail: "Key (phone_e164)=(+919876543210) already exists.",
    });
    const text = safeErrorMessage(dup);
    expect(text).toContain("users_phone_e164_key");
    expect(text).not.toContain("9876543210");
  });
});
