package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.profile.IdentityDTO;
import com._42students.lms.dto.request.BulkRegisterRequest;
import com._42students.lms.dto.request.FacultyDTO;
import com._42students.lms.dto.request.LearnerDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.LearnerService;
import com._42students.lms.service.impl.FacultyServiceImpl;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** CA-S1: IDs in different principal tables can coincide. Tests must assert the read result,
 * not just a security annotation or that an access-control mock was called. */
class CollegeAdminIdentityBoundaryTest {
    private FacultyController facultyController;
    private LearnerController learnerController;
    private FacultyService facultyService;
    private LearnerService learnerService;
    private AccessControlService access;
    private SecurityContextUtil security;
    private ScopeResolutionService scopes;
    private UserPrincipal learner;
    private UserPrincipal ordinaryFaculty;

    @BeforeEach
    void setUp() {
        facultyController = new FacultyController();
        learnerController = new LearnerController();
        facultyService = mock(FacultyService.class);
        learnerService = mock(LearnerService.class);
        access = mock(AccessControlService.class);
        security = mock(SecurityContextUtil.class);
        scopes = mock(ScopeResolutionService.class);
        learner = new UserPrincipal(77, "LEARNER", null, 2, 9, 0);
        ordinaryFaculty = new UserPrincipal(77, "FACULTY", "LECTURER", 2, 9, 0);
        ReflectionTestUtils.setField(facultyController, "facultyService", facultyService);
        ReflectionTestUtils.setField(facultyController, "accessControlService", access);
        ReflectionTestUtils.setField(facultyController, "securityContextUtil", security);
        ReflectionTestUtils.setField(facultyController, "scopeResolutionService", scopes);
        ReflectionTestUtils.setField(learnerController, "learnerService", learnerService);
        ReflectionTestUtils.setField(learnerController, "accessControlService", access);
        ReflectionTestUtils.setField(learnerController, "securityContextUtil", security);
        ReflectionTestUtils.setField(learnerController, "scopeResolutionService", scopes);
    }

    @Test
    void ca01OrdinaryFacultyCannotPromoteThemselfThroughGenericUpdate() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(ordinaryFaculty);
        Faculty existing = new Faculty();
        existing.setId(77);
        existing.setCollegeId(9);
        existing.setFacultyType(FacultyType.LECTURER);
        when(facultyService.getFacultyDetails("77")).thenReturn(existing);
        doThrow(new AccessDeniedException("Admin only"))
                .when(access).requirePerformAdminActionForCollege(ordinaryFaculty, 9);
        FacultyDTO payload = new FacultyDTO();
        payload.setFacultyType(FacultyType.ADMIN);
        assertThrows(AccessDeniedException.class,
                () -> facultyController.updateFaculty(77, payload, null));
        verify(facultyService, never()).updateFaculty(anyInt(), any());
        assertEquals(FacultyType.LECTURER, existing.getFacultyType());
    }

    @Test
    void ca01ServiceRejectsRoleChangeEvenIfCalledOutsideController() {
        FacultyRepository repo = mock(FacultyRepository.class);
        FacultyServiceImpl service = new FacultyServiceImpl();
        ReflectionTestUtils.setField(service, "facultyRepository", repo);
        Faculty current = new Faculty();
        current.setId(77);
        current.setCollegeId(9);
        current.setFacultyType(FacultyType.LECTURER);
        when(repo.findById(77)).thenReturn(Optional.of(current));
        FacultyDTO change = new FacultyDTO();
        change.setFacultyType(FacultyType.ADMIN);
        assertThrows(IllegalArgumentException.class, () -> service.updateFaculty(77, change));
        verify(repo, never()).save(any());
    }

    @Test
    void ca02LearnerCannotRegisterAnotherLearnerEvenWithOwnCollegeId() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        doThrow(new AccessDeniedException("Admin only"))
                .when(access).requirePerformAdminActionForCollege(learner, 9);
        LearnerDTO payload = new LearnerDTO();
        payload.setFirstName("Forged");
        payload.setCollegeId(9);
        assertThrows(AccessDeniedException.class, () -> learnerController.registerUser(payload, null));
        verify(learnerService, never()).register(any());
    }

    @Test
    void ca02RejectsMismatchedClassAndCollegeBeforeRegister() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(scopes.resolveClassToProgramId(31)).thenReturn(21);
        when(scopes.resolveClassToCollegeId(31)).thenReturn(10);
        when(scopes.resolveProgramToCollegeId(21)).thenReturn(10);
        LearnerDTO payload = new LearnerDTO();
        payload.setFirstName("Forged");
        payload.setCollegeId(9);
        payload.setProgramId(21);
        payload.setClassId(31);
        ResponseEntity<?> result = learnerController.registerUser(payload, null);
        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        verify(learnerService, never()).register(any());
    }

    @Test
    void ca03LearnerCannotBulkRegisterOrListOrUndoImports() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        doThrow(new AccessDeniedException("Admin only"))
                .when(access).requirePerformAdminActionForCollege(learner, 9);
        BulkRegisterRequest payload = new BulkRegisterRequest();
        payload.setCollegeId(9);
        assertThrows(AccessDeniedException.class, () -> learnerController.bulkRegister(payload));
        assertThrows(AccessDeniedException.class, () -> learnerController.listBulkImportBatches(9));
        assertThrows(AccessDeniedException.class,
                () -> learnerController.undoBulkImport("batch-77", 9, null));
        verifyNoInteractions(learnerService);
    }

    @Test
    void ca04LearnerCannotChangeAcademicScopeThroughGeneralUpdate() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(scopes.resolveLearnerToCollegeId(77)).thenReturn(9);
        doThrow(new AccessDeniedException("Admin only"))
                .when(access).requirePerformAdminActionForCollege(learner, 9);
        LearnerDTO payload = new LearnerDTO();
        payload.setFirstName("Forged");
        payload.setCollegeId(10);
        payload.setProgramId(21);
        payload.setClassId(31);
        assertThrows(AccessDeniedException.class,
                () -> learnerController.updateLearner(77, payload, null));
        verify(learnerService, never()).updateLearner(anyInt(), any());
    }

    @Test
    void ca10SameNumericIdDoesNotMakeLearnerOwnerOfFacultyIdentity() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        Faculty faculty = facultyWithIdentity(77);
        when(facultyService.getFacultyDetails("77")).thenReturn(faculty);
        ResponseEntity<?> result = facultyController.getFacultyDetails("77");
        assertEquals(HttpStatus.OK, result.getStatusCode());
        Faculty visible = (Faculty) ((Response<?>) result.getBody()).getData();
        assertNotSame(faculty, visible, "Redaction must not mutate a managed Faculty entity");
        assertNull(visible.getIdentity());
        assertNotNull(faculty.getIdentity(), "Persistent identity must be left untouched");
    }

    @Test
    void ca10DepartmentDirectoryRedactsIdentityWithoutMutatingSource() throws Exception {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(learner);
        Faculty faculty = facultyWithIdentity(77);
        when(facultyService.getFacultyByDeptId(4)).thenReturn(List.of(faculty));
        ResponseEntity<?> result = facultyController.getFacultyByDeptId(4);
        @SuppressWarnings("unchecked")
        List<Faculty> visible = (List<Faculty>) ((Response<?>) result.getBody()).getData();
        assertEquals(1, visible.size());
        assertNotSame(faculty, visible.get(0));
        assertNull(visible.get(0).getIdentity());
        assertNotNull(faculty.getIdentity());
    }

    @Test
    void ca10FacultyOwnerCanStillViewOwnIdentity() {
        when(security.getAuthenticatedUserPrincipal()).thenReturn(ordinaryFaculty);
        Faculty faculty = facultyWithIdentity(77);
        when(facultyService.getFacultyDetails("77")).thenReturn(faculty);
        ResponseEntity<?> result = facultyController.getFacultyDetails("77");
        Faculty visible = (Faculty) ((Response<?>) result.getBody()).getData();
        assertSame(faculty, visible);
        assertNotNull(visible.getIdentity());
    }

    private Faculty facultyWithIdentity(int id) {
        Faculty faculty = new Faculty();
        faculty.setId(id);
        faculty.setCollegeId(9);
        faculty.setIdentity(new IdentityDTO());
        return faculty;
    }
}
