package com._42students.lms.service.impl;

import com._42students.lms.model.Course;
import com._42students.lms.model.Department;
import com._42students.lms.model.Lesson;
import com._42students.lms.model.LessonContents;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.LessonContentsRepository;
import com._42students.lms.repository.LessonRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LessonContentsService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class LessonArchiveRecoveryTest {

    private LessonServiceImpl service;
    private LessonRepository lessons;
    private LessonContentsRepository contents;
    private LessonContentsService contentService;
    private com._42students.lms.repository.CourseRepository courses;
    private DepartmentRepository departments;

    @BeforeEach
    void setup() {
        service = new LessonServiceImpl();
        lessons = mock(LessonRepository.class);
        contents = mock(LessonContentsRepository.class);
        contentService = mock(LessonContentsService.class);
        courses = mock(com._42students.lms.repository.CourseRepository.class);
        departments = mock(DepartmentRepository.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);

        service.lessonRepository = lessons;
        service.lessonContentsRepository = contents;
        service.lessonContentsService = contentService;
        service.courseRepository = courses;
        service.departmentRepository = departments;
        service.securityContextUtil = security;

        when(security.getAuthenticatedUserPrincipal())
                .thenReturn(new UserPrincipal(77, "FACULTY", "ADMIN", 3, 9, 0));
    }

    @Test
    void deletingLessonArchivesChildrenAndRetainsBackingFiles() {
        Lesson lesson = new Lesson();
        lesson.setId(10);
        lesson.setCourseId(20);

        LessonContents child = new LessonContents();
        child.setId(30);
        child.setLessonId(10);
        child.setIsDeleted(false);
        child.setDeletedWithLesson(false);

        when(lessons.findById(10)).thenReturn(Optional.of(lesson));
        when(contents.fetchLessonContents1(10)).thenReturn(List.of(child));

        service.deleteLesson(10);

        assertTrue(Boolean.TRUE.equals(lesson.getIsDeleted()));
        assertTrue(Boolean.TRUE.equals(child.getIsDeleted()));
        assertTrue(Boolean.TRUE.equals(child.getDeletedWithLesson()));
        verify(contents).saveAll(List.of(child));
        verify(contentService, never()).deleteContentFileBestEffort(any());
    }

    @Test
    void restoringLessonRestoresOnlyChildrenArchivedWithThatLesson() {
        Lesson lesson = new Lesson();
        lesson.setId(10);
        lesson.setCourseId(20);
        lesson.setIsDeleted(true);

        Course course = new Course();
        course.setId(20);
        course.setDeptId(40);

        Department department = new Department();
        department.setId(40);
        department.setCollegeId(9);

        LessonContents child = new LessonContents();
        child.setId(30);
        child.setLessonId(10);
        child.setIsDeleted(true);
        child.setDeletedWithLesson(true);

        when(lessons.findById(10)).thenReturn(Optional.of(lesson));
        when(lessons.save(lesson)).thenReturn(lesson);
        when(courses.findById(20)).thenReturn(Optional.of(course));
        when(departments.findById(40)).thenReturn(Optional.of(department));
        when(contents.findByLessonIdAndDeletedWithLessonTrue(10)).thenReturn(List.of(child));

        service.restoreLesson(10, 9);

        assertFalse(Boolean.TRUE.equals(lesson.getIsDeleted()));
        assertFalse(Boolean.TRUE.equals(child.getIsDeleted()));
        assertFalse(Boolean.TRUE.equals(child.getDeletedWithLesson()));
        verify(contents).saveAll(List.of(child));
    }
}
