package com._42students.lms.service;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.model.College;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.*;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Verifies bulk audit partitioning by college, with no cross-college learner leakage. */
class ModuleAccessBulkCollegeAuditTest {
    private ModuleAccessService service;
    private AdminAuditLogService audit;
    private AppSettingsService settings;
    private LearnerRepository learners;
    private HttpServletRequest request;
    private final UserPrincipal superadmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);

    private Learner learner(int id, int collegeId) {
        Learner row = new Learner();
        row.setId(id);
        row.setCollegeId(collegeId);
        row.setIsDeleted(false);
        return row;
    }

    @BeforeEach
    void setUp() {
        audit = mock(AdminAuditLogService.class);
        settings = mock(AppSettingsService.class);
        learners = mock(LearnerRepository.class);
        request = mock(HttpServletRequest.class);
        AccessControlService access = mock(AccessControlService.class);
        CollegeRepository colleges = mock(CollegeRepository.class);
        when(access.isSuperAdmin(any())).thenReturn(true);
        for (int collegeId : List.of(5, 9)) {
            College college = new College();
            college.setId(collegeId);
            when(colleges.findById(collegeId)).thenReturn(Optional.of(college));
        }
        service = new ModuleAccessService(settings, mock(ModuleAccessResolver.class), access,
                audit, mock(DepartmentRepository.class), mock(NewProgramRepository.class),
                mock(BatchRepository.class), mock(_ClassRepository.class), learners, colleges,
                mock(OrganizationRepository.class), mock(FacultyRepository.class));
    }

    @SuppressWarnings("unchecked")
    @Test
    void globalSuperadminMixedCollegeBulkCreatesSeparatedSearchableHistory() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 5), learner(88, 9), learner(79, 5)));
        when(settings.getSettingValue("LEARNER", 77, "module.projects.enabled")).thenReturn("true");
        when(settings.getSettingValue("LEARNER", 88, "module.projects.enabled")).thenReturn("false");

        Map<String, Object> result = service.setBulkForLearners(superadmin, "projects", null,
                List.of(77, 88, 79), request);

        assertEquals(3, result.get("updated"));
        ArgumentCaptor<Integer> colleges = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<Map<String, Object>> payloads = ArgumentCaptor.forClass((Class) Map.class);
        verify(audit, times(2)).logRequired(eq(request), eq("MODULE_ACCESS_BULK_SET"), eq("learner"),
                isNull(), isNull(), colleges.capture(), payloads.capture());
        assertEquals(List.of(5, 9), colleges.getAllValues());
        Map<String, Object> first = payloads.getAllValues().get(0);
        Map<String, Object> second = payloads.getAllValues().get(1);
        assertEquals(List.of(77, 79), first.get("learnerIds"));
        assertEquals(2, first.get("learnerCount"));
        assertEquals(Map.of("77", "true", "79", "null"), first.get("previousValues"));
        assertEquals(List.of(88), second.get("learnerIds"));
        assertEquals(1, second.get("learnerCount"));
        assertEquals(Map.of("88", "false"), second.get("previousValues"));
        verify(audit, never()).logRequired(eq(request), eq("MODULE_ACCESS_BULK_SET"), eq("learner"),
                isNull(), isNull(), isNull(), anyMap());
    }

    @Test
    void sameCollegeSelectionStillCreatesOneAuditRow() {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 5), learner(79, 5)));
        service.setBulkForLearners(superadmin, "electives", null, List.of(77, 79), request);
        verify(audit, times(1)).logRequired(eq(request), eq("MODULE_ACCESS_BULK_SET"), eq("learner"),
                isNull(), isNull(), eq(5), anyMap());
    }

    @Test
    void bulkAuditFailureIsNotSwallowedAndMethodIsTransactional() throws Exception {
        when(learners.findAllById(any())).thenReturn(List.of(learner(77, 5), learner(88, 9)));
        doThrow(new IllegalStateException("audit unavailable"))
                .when(audit).logRequired(eq(request), eq("MODULE_ACCESS_BULK_SET"), eq("learner"),
                        isNull(), isNull(), eq(9), anyMap());
        assertThrows(IllegalStateException.class, () -> service.setBulkForLearners(
                superadmin, "projects", null, List.of(77, 88), request));
        assertNotNull(ModuleAccessService.class.getMethod("setBulkForLearners", UserPrincipal.class,
                String.class, Boolean.class, List.class, HttpServletRequest.class)
                .getAnnotation(Transactional.class), "Bulk writes and audit must share a transaction");
    }
}
