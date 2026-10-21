package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.SemesterDTO;
import com._42students.lms.model.Semester;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.SemesterCourseService;
import com._42students.lms.service.SemesterService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SemesterControllerErrorSemanticsTest {
    private SemesterController controller;
    private SemesterService service;
    private SemesterRepository repository;
    private ScopeResolutionService scope;
    private UserPrincipal admin;

    @BeforeEach
    void setup() {
        service = mock(SemesterService.class);
        repository = mock(SemesterRepository.class);
        scope = mock(ScopeResolutionService.class);
        AccessControlService access = mock(AccessControlService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        admin = new UserPrincipal(42, "FACULTY", "ADMIN", 1, 7, 0);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(admin);
        controller = new SemesterController(service, mock(SemesterCourseService.class), security,
  access, scope, repository, mock(SemesterCourseRepository.class));
        when(scope.resolveProgramToCollegeId(3)).thenReturn(7);
    }

    @Test
    void missingSemesterIsNotFoundNotGenericFailure() {
        when(repository.findById(55)).thenReturn(Optional.empty());
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
  () -> controller.getSemesterById(55));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    @Test
    void unexpectedSemesterReadFailureIsServerErrorNotNotFound() {
        when(repository.findById(55)).thenReturn(Optional.of(new Semester(3, 1, "First")));
        when(service.getSemesterById(55)).thenThrow(new IllegalStateException("database unavailable"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, controller.getSemesterById(55).getStatusCode());
    }

    @Test
    void unexpectedCreateFailureIsServerErrorNotValidationFailure() {
        SemesterDTO request = new SemesterDTO();
        request.setProgramId(3);
        when(service.createSemester(request)).thenThrow(new IllegalStateException("database unavailable"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, controller.createSemester(request).getStatusCode());
    }

    @Test
    void missingSemesterUpdateIsNotFound() {
        when(repository.findById(55)).thenReturn(Optional.empty());
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
  () -> controller.updateSemester(55, new SemesterDTO()));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }
}
