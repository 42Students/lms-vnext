package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.College;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.*;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OptionalModuleMentorBulkRegressionTest {
    @Test
    void mentorImpactQueryExcludesInactiveMembershipsButKeepsLegacyBlankStatuses() throws Exception {
        Query query = ProjectMemberRepository.class
                .getMethod("countActivePrimaryMentorsForCollege", Integer.class)
                .getAnnotation(Query.class);
        assertNotNull(query);
        String jpql = query.value();
        assertTrue(jpql.contains("m.isDeleted = false"));
        assertTrue(jpql.contains("m.memberStatus IS NULL"));
        assertTrue(jpql.contains("TRIM(m.memberStatus) = ''"));
        assertTrue(jpql.contains("UPPER(TRIM(m.memberStatus)) = 'ACTIVE'"));
        assertTrue(jpql.contains("COUNT(DISTINCT m.userId)"));
    }

    private static ModuleAccessService service(LearnerRepository learners, CollegeRepository colleges,
                                               AccessControlService access, AppSettingsService settings,
                                               AdminAuditLogService audit) {
        return new ModuleAccessService(settings, mock(ModuleAccessResolver.class), access, audit,
                mock(DepartmentRepository.class), mock(NewProgramRepository.class),
                mock(BatchRepository.class), mock(_ClassRepository.class), learners, colleges,
                mock(OrganizationRepository.class), mock(FacultyRepository.class));
    }

    @Test
    void duplicateIdsBeyondRawLimitAreProcessedOnlyOnce() {
        LearnerRepository learners = mock(LearnerRepository.class);
        CollegeRepository colleges = mock(CollegeRepository.class);
        AccessControlService access = mock(AccessControlService.class);
        AppSettingsService settings = mock(AppSettingsService.class);
        AdminAuditLogService audit = mock(AdminAuditLogService.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", null, null, 0);
        when(access.isSuperAdmin(principal)).thenReturn(true);
        Learner learner = new Learner();
        learner.setId(77);
        learner.setCollegeId(5);
        when(learners.findAllById(any())).thenReturn(List.of(learner));
        College college = new College();
        college.setId(5);
        when(colleges.findById(5)).thenReturn(Optional.of(college));

        var result = service(learners, colleges, access, settings, audit).setBulkForLearners(
                principal, "projects", null, Collections.nCopies(1001, 77), request);
        assertEquals(1, result.get("updated"));
        verify(learners).findAllById(List.of(77));
        verify(settings, times(1)).delete("LEARNER", 77, "module.projects.enabled");
        verify(settings, times(1)).delete("LEARNER", 77, "module.projects.locked");
        verify(audit, times(1)).logRequired(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void moreThanOneThousandDistinctLearnersRejectedBeforeAnyDatabaseAccess() {
        LearnerRepository learners = mock(LearnerRepository.class);
        AccessControlService access = mock(AccessControlService.class);
          UserPrincipal principal = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
          when(access.isSuperAdmin(principal)).thenReturn(true);
          ModuleAccessService service = service(learners, mock(CollegeRepository.class),
                  access, mock(AppSettingsService.class), mock(AdminAuditLogService.class));
        List<Integer> ids = IntStream.rangeClosed(1, 1001).boxed().collect(Collectors.toList());
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.setBulkForLearners(principal, "projects", null, ids, null));
        assertEquals("Select at most 1000 students at a time", ex.getMessage());
        verifyNoInteractions(learners);
    }
}
