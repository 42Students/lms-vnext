package com._42students.lms.service.impl;

import com._42students.lms.access.ScopeResolutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** A session's class, course, faculty and hall must not mix colleges. */
class ClassScheduleCourseCollegeBoundaryTest {
    private ClassScheduleServiceImpl service;
    private ScopeResolutionService scopes;

    @BeforeEach
    void setup() {
        service = new ClassScheduleServiceImpl();
        scopes = mock(ScopeResolutionService.class);
        ReflectionTestUtils.setField(service, "scopeResolutionService", scopes);
    }

    private void check(int classId, int courseId) {
        ReflectionTestUtils.invokeMethod(service, "requireSameCollegeCourse", classId, courseId);
    }

    @Test
    void sameCollegeCourseIsAllowed() {
        when(scopes.resolveClassToCollegeId(11)).thenReturn(10);
        when(scopes.resolveCourseToCollegeId(21)).thenReturn(10);
        assertDoesNotThrow(() -> check(11, 21));
        verify(scopes).resolveClassToCollegeId(11);
        verify(scopes).resolveCourseToCollegeId(21);
    }

    @Test
    void differentCollegeCourseIsRejected() {
        when(scopes.resolveClassToCollegeId(11)).thenReturn(10);
        when(scopes.resolveCourseToCollegeId(21)).thenReturn(20);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> check(11, 21));
        assertTrue(ex.getMessage().contains("Course does not belong"));
    }

    @Test
    void deletedOrMissingCourseIsRejected() {
        when(scopes.resolveClassToCollegeId(11)).thenReturn(10);
        when(scopes.resolveCourseToCollegeId(21)).thenReturn(null);
        assertThrows(IllegalArgumentException.class, () -> check(11, 21));
    }

    @Test
    void deletedOrMissingClassIsRejected() {
        when(scopes.resolveClassToCollegeId(11)).thenReturn(null);
        when(scopes.resolveCourseToCollegeId(21)).thenReturn(10);
        assertThrows(IllegalArgumentException.class, () -> check(11, 21));
    }

    @Test
    void courseLessLegacySessionIsNotForcedToHaveACourse() {
        assertDoesNotThrow(() -> check(11, 0));
        verifyNoInteractions(scopes);
    }

    @Test
    void noClassLegacySessionPreservesPriorBehavior() {
        assertDoesNotThrow(() -> check(0, 21));
        verifyNoInteractions(scopes);
    }
}
