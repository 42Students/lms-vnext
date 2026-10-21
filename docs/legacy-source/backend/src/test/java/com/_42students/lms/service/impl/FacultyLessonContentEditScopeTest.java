package com._42students.lms.service.impl;

import com._42students.lms.dto.request.LessonContentsDTO;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Faculty can now reach the lesson-content update endpoint (it was admin-only by accident), so the
 * fields that move content elsewhere must stay admin-only for a regular faculty member.
 */
class FacultyLessonContentEditScopeTest {

    private LessonContentsServiceImpl service;
    private LessonContentsRepository repo;
    private FacultyTeachingAssignmentRepository teaching;
    private SecurityContextUtil security;
    private LessonContents content;

    @BeforeEach
    void setUp() {
        service = new LessonContentsServiceImpl();
        repo = mock(LessonContentsRepository.class);
        teaching = mock(FacultyTeachingAssignmentRepository.class);
        security = mock(SecurityContextUtil.class);
        ReflectionTestUtils.setField(service, "lessonContentsRepository", repo);
        ReflectionTestUtils.setField(service, "facultyTeachingAssignmentRepository", teaching);
        ReflectionTestUtils.setField(service, "securityContextUtil", security);

        content = new LessonContents();
        content.setId(650);
        content.setLessonId(21);
        content.setCourseId(12);
        content.setClassId(9);
        content.setFacultyId(15);
        content.setContentTitle("Strings in java");
        content.setContentType("video");
        when(repo.findById(650)).thenReturn(Optional.of(content));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(teaching.existsByFacultyIdAndCourseIdAndClassIdAndIsActive(15, 12, 9, true)).thenReturn(true);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(15, "FACULTY", "PERMANENT", 6, 6, 0));
    }

    @Test
    void ownerFacultyCanEditTheirOwnContent() {
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setContentTitle("Strings in Java");
        LessonContents saved = service.updateLessonContent(650, dto);
        assertEquals("Strings in Java", saved.getContentTitle());
    }

    @Test
    void facultyCannotHandContentToSomeoneElse() {
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setFacultyId(99);
        LessonContents saved = service.updateLessonContent(650, dto);
        assertEquals(15, saved.getFacultyId());
    }

    @Test
    void facultyCannotMoveContentIntoASectionTheyDoNotTeach() {
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setClassId(10);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.updateLessonContent(650, dto));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }

    @Test
    void facultyCannotMakeContentSharedWithEverySection() {
        LessonContentsDTO dto = new LessonContentsDTO();
        dto.setClassId(-1);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.updateLessonContent(650, dto));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }
}
