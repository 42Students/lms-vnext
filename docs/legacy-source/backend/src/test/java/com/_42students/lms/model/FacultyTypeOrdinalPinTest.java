package com._42students.lms.model;

import com._42students.lms.enums.FacultyType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Pins the declaration order of {@link FacultyType}.
 *
 * <p>{@code Faculty.facultyType} is declared as a bare {@code private FacultyType facultyType;}
 * with no {@code @Enumerated} annotation, so JPA stores it with its default strategy — ORDINAL.
 * The {@code faculty.faculty_type} column is an {@code int}, and a college admin is simply a row
 * holding the number 4.
 *
 * <p>That makes the declaration order of this enum load-bearing for authorization. Adding a value
 * anywhere except the end — an entirely routine change, and one nothing in the codebase warns
 * against — shifts every later constant down by one. Existing rows are not rewritten, so they would
 * silently re-read as the wrong role: every college admin would stop being ADMIN, and whichever
 * value landed on 4 would become admin instead. Nothing would fail loudly; logins would simply
 * start granting the wrong console.
 *
 * <p>This test makes that change fail the build instead. It is a guard, not a fix — the durable fix
 * is {@code @Enumerated(EnumType.STRING)} plus a migration of the existing int column, which
 * touches a live authorization column and is tracked separately as a decision.
 *
 * <p>Appending new values at the END is safe and will not break this test's ordinal assertions,
 * only its count — update the expected list in that case.
 */
class FacultyTypeOrdinalPinTest {

    /** Exactly the persisted order. Index == the integer stored in faculty.faculty_type. */
    private static final List<String> PINNED = List.of(
            "PERMANENT",              // 0
            "GUEST",                  // 1
            "VISITING",               // 2
            "CONTRACT",               // 3
            "ADMIN",                  // 4  <- college admin; ROLE_ADMIN is granted off this value
            "HEAD",                   // 5
            "COORDINATOR",            // 6
            "CLERK",                  // 7
            "PROFESSOR",              // 8
            "ASSOCIATE_PROFESSOR",    // 9
            "ASSISTANT_PROFESSOR",    // 10
            "LECTURER",               // 11
            "ADJUNCT",                // 12
            "MENTOR",                 // 13 <- routes to the /mentor console
            "TPO"                     // 14 <- Training & Placement Officer, super-admin managed (docs/recruiter-tpo)
    );

    @Test
    @DisplayName("FacultyType ordinals are unchanged — reordering silently reassigns every faculty role")
    void ordinalsAreStable() {
        List<String> actual = java.util.Arrays.stream(FacultyType.values())
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toList());

        assertEquals(PINNED, actual,
                "FacultyType's declaration order changed. faculty.faculty_type stores ORDINALS, so "
                        + "existing rows now resolve to different roles than they did before this change. "
                        + "If you are ADDING a value, append it to the end of the enum and to PINNED. "
                        + "If you are REORDERING or REMOVING, a data migration is required first.");
    }

    @Test
    @DisplayName("ADMIN and MENTOR sit at the ordinals the existing data was written with")
    void securityCriticalOrdinalsArePinned() {
        // Asserted separately and by number, so the failure message names the actual stored value
        // when someone changes the order without reading the test above.
        assertEquals(4, FacultyType.ADMIN.ordinal(),
                "ADMIN must stay at ordinal 4 — every existing college admin row stores the integer 4.");
        assertEquals(13, FacultyType.MENTOR.ordinal(),
                "MENTOR must stay at ordinal 13 — every existing mentor row stores the integer 13.");
        assertEquals(14, FacultyType.TPO.ordinal(),
                "TPO must stay at ordinal 14 — every TPO row stores the integer 14.");
    }
}
