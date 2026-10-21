package com._42students.lms.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResourceUploadControllerTest {
    @Test
    void classScopedKeysBindTenantCourseClassAndUploader() {
        assertEquals("org-11/college-22/lesson-content/course-99/class-33/user-44/",
                ResourceUploadController.keyPrefix(11, 22, 99, 33, 44));
        assertNotEquals(ResourceUploadController.keyPrefix(11, 22, 99, 33, 44),
                ResourceUploadController.keyPrefix(11, 22, 100, 33, 44));
        assertNotEquals(ResourceUploadController.keyPrefix(11, 22, 99, 33, 44),
                ResourceUploadController.keyPrefix(11, 22, 99, 33, 45));
        assertNotEquals(ResourceUploadController.keyPrefix(11, 22, 99, 33, 44),
                ResourceUploadController.keyPrefix(11, 22, 99, 34, 44));
    }

    @Test
    void sharedResourcesUseCourseScopeAndRejectMissingCourse() {
        assertEquals("org-11/college-22/lesson-content/course-99/user-0/",
                ResourceUploadController.keyPrefix(11, 22, 99, null, 0));
        assertThrows(IllegalArgumentException.class,
                () -> ResourceUploadController.keyPrefix(11, 22, null, 33, 44));
        assertThrows(IllegalArgumentException.class,
                () -> ResourceUploadController.keyPrefix(11, 22, 0, null, 44));
        assertThrows(IllegalArgumentException.class,
                () -> ResourceUploadController.keyPrefix(0, 22, 99, null, 44));
    }
}
