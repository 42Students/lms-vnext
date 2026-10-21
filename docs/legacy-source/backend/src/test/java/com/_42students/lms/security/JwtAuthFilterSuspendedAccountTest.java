package com._42students.lms.security;

import com._42students.lms.model.Faculty;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.LearnerRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

/**
 * Suspension must end existing sessions, not merely block future logins.
 *
 * <p>getCurrentTokenVersion previously looked the user up with a bare findById and never
 * consulted isDeleted, so a suspended account's already-issued access token kept authenticating
 * every request until it expired on its own. An admin suspending a compromised or departing
 * account got "cannot log in again" when the button says, and the situation demands, "is logged
 * out now".
 *
 * <p>The method is private, so these exercise it directly — the two call sites both treat a null
 * return as "reject the request", which is what makes the null meaningful.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthFilterSuspendedAccountTest {

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private LearnerRepository learnerRepository;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private Integer currentTokenVersion(Integer userId, String userType) {
        return currentTokenVersion(userId, userType, false);
    }

    // superAdmin: the signed capability claim; super-admin principals have no account row.
    private Integer currentTokenVersion(Integer userId, String userType, boolean superAdmin) {
        // The filter now resolves the account type first (PrincipalType) and refuses unknown types
        // before ever looking up a token version, so an unparseable type means "rejected" (null).
        PrincipalType type = PrincipalType.parse(userType).orElse(null);
        if (type == null) return null;
        return (Integer) ReflectionTestUtils.invokeMethod(
                filter, "getCurrentTokenVersion", userId, type, superAdmin);
    }

    private static Faculty faculty(int id, boolean deleted, Integer tokenVersion) {
        Faculty f = new Faculty();
        f.setId(id);
        f.setIsDeleted(deleted);
        f.setTokenVersion(tokenVersion);
        return f;
    }

    private static Learner learner(int id, boolean deleted, Integer tokenVersion) {
        Learner l = new Learner();
        l.setId(id);
        l.setIsDeleted(deleted);
        l.setTokenVersion(tokenVersion);
        return l;
    }

    @Test
    @DisplayName("an active faculty account resolves its token version normally")
    void activeFacultyResolves() {
        when(facultyRepository.findById(7)).thenReturn(Optional.of(faculty(7, false, 3)));

        assertEquals(3, currentTokenVersion(7, "FACULTY"));
    }

    @Test
    @DisplayName("a suspended faculty account is rejected even with a structurally valid token")
    void suspendedFacultyRejected() {
        when(facultyRepository.findById(7)).thenReturn(Optional.of(faculty(7, true, 3)));

        assertNull(currentTokenVersion(7, "FACULTY"),
                "a soft-deleted faculty account must not authenticate an existing session");
    }

    @Test
    @DisplayName("an active learner account resolves its token version normally")
    void activeLearnerResolves() {
        when(learnerRepository.findById(11)).thenReturn(Optional.of(learner(11, false, 0)));

        assertEquals(0, currentTokenVersion(11, "LEARNER"));
    }

    @Test
    @DisplayName("a suspended learner account is rejected too — the fix is not admin-specific")
    void suspendedLearnerRejected() {
        when(learnerRepository.findById(11)).thenReturn(Optional.of(learner(11, true, 0)));

        assertNull(currentTokenVersion(11, "LEARNER"),
                "a soft-deleted learner account must not authenticate an existing session");
    }

    @Test
    @DisplayName("a null tokenVersion on an active account still means version 0, not rejection")
    void nullTokenVersionIsZeroNotRejection() {
        when(facultyRepository.findById(7)).thenReturn(Optional.of(faculty(7, false, null)));

        assertEquals(0, currentTokenVersion(7, "FACULTY"),
                "legacy rows with no version must keep working; only isDeleted rejects");
    }

    @Test
    @DisplayName("a missing account is rejected")
    void missingAccountRejected() {
        when(facultyRepository.findById(99)).thenReturn(Optional.empty());

        assertNull(currentTokenVersion(99, "FACULTY"));
    }

    @Test
    @DisplayName("the built-in superadmin (id 0) short-circuits before any repository lookup")
    void superAdminShortCircuits() {
        assertEquals(0, currentTokenVersion(0, "FACULTY", true));
    }
}
