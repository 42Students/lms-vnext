import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  departments,
  facultyProfiles,
  learnerProfiles,
} from "@/db/schema";
import { drizzlePeopleRepository } from "./repository";
import { PeopleServiceError } from "./errors";
import {
  emptyLearnerProfileDocument,
  learnerProfileDocumentSchema,
} from "./profile-validation";
import type {
  FacultyProfileView,
  LearnerProfileView,
  ProfileRepository,
} from "./profile-service";

export const drizzleProfileRepository: ProfileRepository = {
  loadMembershipDetail(membershipId) {
    return drizzlePeopleRepository.loadMembershipDetail(membershipId);
  },

  async loadLearnerProfile(
    membershipId,
  ): Promise<LearnerProfileView | null> {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(learnerProfiles)
      .where(eq(learnerProfiles.membershipId, membershipId))
      .limit(1);

    return profile
      ? {
          ...profile,
          profileDocument:
            learnerProfileDocumentSchema.parse(
              profile.profileDocument ?? {},
            ),
        }
      : null;
  },

  async upsertLearnerProfile(
    membershipId,
    input,
  ): Promise<LearnerProfileView> {
    const db = getDb();
    const [profile] = await db
      .insert(learnerProfiles)
      .values({
        membershipId,
        rollNumber: input.rollNumber ?? null,
        registrationNumber: input.registrationNumber ?? null,
      })
      .onConflictDoUpdate({
        target: learnerProfiles.membershipId,
        set: {
          rollNumber: input.rollNumber ?? null,
          registrationNumber: input.registrationNumber ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!profile) {
      throw new Error("Learner profile upsert returned no row");
    }

    return {
      ...profile,
      profileDocument:
        learnerProfileDocumentSchema.parse(
          profile.profileDocument ??
            emptyLearnerProfileDocument,
        ),
    };
  },

  async upsertLearnerProfileDocument(
    membershipId,
    document,
  ): Promise<LearnerProfileView> {
    // Until an encrypted/private identity vault is provisioned, reject these
    // fields explicitly instead of placing national ID numbers in generic
    // profile_document JSONB or silently discarding user input.
    if (document.identity.aadhaarNumber || document.identity.panNumber) {
      throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
    }
    const db = getDb();
    const [profile] = await db
      .insert(learnerProfiles)
      .values({
        membershipId,
        profileDocument: document,
      })
      .onConflictDoUpdate({
        target: learnerProfiles.membershipId,
        set: {
          profileDocument: document,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!profile) {
      throw new Error(
        "Learner profile document upsert returned no row",
      );
    }

    return {
      ...profile,
      profileDocument:
        learnerProfileDocumentSchema.parse(
          profile.profileDocument,
        ),
    };
  },

  async loadFacultyProfile(
    membershipId,
  ): Promise<FacultyProfileView | null> {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(facultyProfiles)
      .where(eq(facultyProfiles.membershipId, membershipId))
      .limit(1);

    return profile ?? null;
  },

  async upsertFacultyProfile(
    membershipId,
    input,
  ): Promise<FacultyProfileView> {
    const db = getDb();
    const [profile] = await db
      .insert(facultyProfiles)
      .values({
        membershipId,
        primaryDepartmentId: input.primaryDepartmentId ?? null,
        employmentType: input.employmentType ?? null,
        academicTitle: input.academicTitle ?? null,
      })
      .onConflictDoUpdate({
        target: facultyProfiles.membershipId,
        set: {
          primaryDepartmentId: input.primaryDepartmentId ?? null,
          employmentType: input.employmentType ?? null,
          academicTitle: input.academicTitle ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!profile) {
      throw new Error("Faculty profile upsert returned no row");
    }

    return profile;
  },

  async hasActiveDepartment(departmentId, collegeId) {
    const db = getDb();
    const [department] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.collegeId, collegeId),
          isNull(departments.archivedAt),
        ),
      )
      .limit(1);

    return Boolean(department);
  },
};
