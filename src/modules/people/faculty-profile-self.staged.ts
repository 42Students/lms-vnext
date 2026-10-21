import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { PeopleServiceError } from "./errors";
import { facultyProfileDocumentStorageReady } from "./faculty-profile-readiness";
import { facultyPrivateReceiptsUnchanged } from "./faculty-self-section-model";
import {
  emptyFacultyProfileDocument,
  facultyContactEditSchema,
  facultyLegacyProfileExceptions,
  facultyProfileDocumentSchema,
  type FacultyProfileDocument,
} from "./faculty-profile-document";

export const FACULTY_SELF_DOCUMENT_SECTIONS=[
 "about","personalDetails","contact","address","socialProfiles",
 "languages","education","certifications","experiences","skills",
 "publications","awards","metadata",
] as const;

/** Legacy profile sections remain independently discoverable without
 * parallel network requests. This read-only status cannot authorize writes. */
export function facultyStoredSectionStates(raw:unknown){
 const source=raw&&typeof raw==="object"&&!Array.isArray(raw)
  ? raw as Record<string,unknown> : {};
 const parsed=facultyProfileDocumentSchema.safeParse(source);
 const invalid=new Set(parsed.success?[]:parsed.error.issues.map(issue=>
  String(issue.path[0]??"document")));
 return FACULTY_SELF_DOCUMENT_SECTIONS.map(section=>({
  section,status:invalid.has(section)?"INVALID" as const:
    Object.prototype.hasOwnProperty.call(source,section)?"AVAILABLE" as const:
      "NOT_PROVIDED" as const,
 }));
}

/** An older DB migration may carry future/legacy JSON keys. When one known
 * section is saved, keep untouched unknown persisted keys in the database;
 * never accept new unknown data directly from a browser. */
function preserveStoredUnknownFacultyKeys(raw:unknown, next:FacultyProfileDocument){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return next;
 const source=raw as Record<string,unknown>;
 const preserved=Object.fromEntries(Object.entries(source).filter(
  ([key])=>!Object.prototype.hasOwnProperty.call(next,key)));
 return {...preserved,...next};
}

type FacultyProfileDocumentRow = {
  membership_id: string;
  profile_document: unknown;
  profile_document_version: number;
};

function resourceScope(context: RequestContext) {
  if (!context.membership) {
    throw new PeopleServiceError("FACULTY_ROLE_REQUIRED");
  }
  return {
    organizationId: context.membership.organizationId,
    collegeId: context.membership.collegeId,
  };
}

function assertPersistedFaculty(
  context: RequestContext,
) {
  if (
    !context.membership ||
    !context.membership.roles.includes("FACULTY")
  ) {
    throw new PeopleServiceError("FACULTY_ROLE_REQUIRED");
  }
  return context.membership;
}

/** A malformed migrated section must never be silently replaced by defaults
 * during a whole-document save (which would destroy the original data). */
function parseStoredFacultyDocument(raw: unknown): FacultyProfileDocument {
  const parsed = facultyProfileDocumentSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    // The report intentionally contains only section names/counts, not PII.
    facultyLegacyProfileExceptions(raw);
    throw new PeopleServiceError("FACULTY_PROFILE_LEGACY_REMEDIATION_REQUIRED");
  }
  return parsed.data;
}

function toView(row: FacultyProfileDocumentRow | undefined) {
  if (!row) {
    return {
      document: emptyFacultyProfileDocument,
      version: 0,
    };
  }
  return {
    document: parseStoredFacultyDocument(row.profile_document),
    version: row.profile_document_version,
  };
}

/**
 * Faculty self-profile adapter. The canonical faculty_profiles schema includes
 * the document + version columns and authenticated self-document routes call
 * this adapter after checking the live migration readiness gate.
 *
 * The write authorization recheck and the mutation happen in one transaction,
 * so platform disable, membership suspension and FACULTY-role revocation
 * cannot race a stale authenticated RequestContext.
 */
export async function loadOwnFacultyProfileDocumentStaged(
  context: RequestContext,
) {
  return getDb().transaction(async (tx) => {
    const persisted =
      await assertPersistedPlatformPermission(
        tx,
        context,
        "profile.self.manage",
        resourceScope(context),
      );
    const membership = assertPersistedFaculty(persisted);
    // Do not access unregistered optional columns on a fresh database.
    if (!(await facultyProfileDocumentStorageReady(tx))) {
      throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
    }

    const result =
      await tx.execute<FacultyProfileDocumentRow>(sql`
        select
          membership_id,
          profile_document,
          profile_document_version
        from faculty_profiles
        where membership_id = ${membership.id}
        for share
      `);

    const row=result.rows[0];
    const view=toView(row);
    return {...view,sections:facultyStoredSectionStates(row?.profile_document)};
  });
}

export async function saveOwnFacultyProfileDocumentStaged(
  context: RequestContext,
  rawDocument: unknown,
  expectedVersion: number,
): Promise<{
  document: FacultyProfileDocument;
  version: number;
}> {
  if (
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 0
  ) {
    throw new PeopleServiceError(
      "FACULTY_PROFILE_VERSION_CONFLICT",
    );
  }

  const document =
    facultyProfileDocumentSchema.parse(rawDocument);

  return getDb().transaction(async (tx) => {
    const persisted =
      await assertPersistedPlatformPermission(
        tx,
        context,
        "profile.self.manage",
        resourceScope(context),
      );
    const membership = assertPersistedFaculty(persisted);
    // Do not access unregistered optional columns on a fresh database.
    if (!(await facultyProfileDocumentStorageReady(tx))) {
      throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
    }

    const locked =
      await tx.execute<FacultyProfileDocumentRow>(sql`
        select
          membership_id,
          profile_document,
          profile_document_version
        from faculty_profiles
        where membership_id = ${membership.id}
        for update
      `);

    const current = locked.rows[0];
    const persistedDocument = current
      ? parseStoredFacultyDocument(current.profile_document)
      : emptyFacultyProfileDocument;
    // A full-document writer must not bypass the section-level contact rules.
    // Previously saved legacy empty contacts remain readable and may be
    // retained while unrelated sections are edited.
    if (JSON.stringify(persistedDocument.contact) !== JSON.stringify(document.contact)) {
      facultyContactEditSchema.parse(document.contact);
    }
    // The generic section writer must not accept forged file/identity receipts.
    if (!facultyPrivateReceiptsUnchanged(persistedDocument, document)) {
      throw new PeopleServiceError("PRIVATE_IDENTITY_UPDATE_DENIED");
    }

    if (!current) {
      if (expectedVersion !== 0) {
        throw new PeopleServiceError(
          "FACULTY_PROFILE_VERSION_CONFLICT",
        );
      }

      const inserted =
        await tx.execute<FacultyProfileDocumentRow>(sql`
          insert into faculty_profiles (
            membership_id,
            profile_document,
            profile_document_version,
            created_at,
            updated_at
          )
          values (
            ${membership.id},
            ${JSON.stringify(document)}::jsonb,
            1,
            clock_timestamp(),
            clock_timestamp()
          )
          returning
            membership_id,
            profile_document,
            profile_document_version
        `);

      const row = inserted.rows[0];
      if (!row) {
        throw new Error(
          "Faculty profile document insert returned no row",
        );
      }
      return toView(row);
    }

    if (
      current.profile_document_version !==
      expectedVersion
    ) {
      throw new PeopleServiceError(
        "FACULTY_PROFILE_VERSION_CONFLICT",
      );
    }

    const updated =
      await tx.execute<FacultyProfileDocumentRow>(sql`
        update faculty_profiles
        set
          profile_document =
            ${JSON.stringify(preserveStoredUnknownFacultyKeys(current.profile_document,document))}::jsonb,
          profile_document_version =
            profile_document_version + 1,
          updated_at = clock_timestamp()
        where membership_id = ${membership.id}
          and profile_document_version =
            ${expectedVersion}
        returning
          membership_id,
          profile_document,
          profile_document_version
      `);

    const row = updated.rows[0];
    if (!row) {
      throw new PeopleServiceError(
        "FACULTY_PROFILE_VERSION_CONFLICT",
      );
    }

    return toView(row);
  });
}
