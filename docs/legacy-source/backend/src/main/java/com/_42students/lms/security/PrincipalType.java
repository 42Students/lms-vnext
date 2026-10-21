package com._42students.lms.security;

import java.util.Locale;
import java.util.Optional;

/**
 * Every kind of account that can hold a token. The auth core (JWT filter, refresh, handoff,
 * switch, token versions) switches on this enum; an unknown or missing value is rejected, never
 * defaulted to a learner or a faculty. Adding a value here fails compilation of every exhaustive
 * switch until that code decides how to treat the new type. See docs/recruiter-tpo/DESIGN.md.
 *
 * The super admin is not a separate type: it is FACULTY with id 0 (see UserPrincipal.forSuperAdmin).
 */
public enum PrincipalType {
    LEARNER,
    FACULTY,
    RECRUITER;

    /** Strict parse of a token / database userType. Empty for null, blank or unknown values. */
    public static Optional<PrincipalType> parse(String raw) {
        if (raw == null) return Optional.empty();
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if (value.isEmpty()) return Optional.empty();
        for (PrincipalType type : values()) {
            if (type.name().equals(value)) return Optional.of(type);
        }
        return Optional.empty();
    }
}
