package com._42students.lms.controller;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * A recruiter cannot end their own access to a college: only the college (TPO) or the super admin can.
 * No recruiter endpoint may offer a "leave" for college access.
 */
class RecruiterSelfControllerNoLeaveTest {

    private static String[] paths(Method m) {
        if (m.isAnnotationPresent(PutMapping.class)) return m.getAnnotation(PutMapping.class).value();
        if (m.isAnnotationPresent(PostMapping.class)) return m.getAnnotation(PostMapping.class).value();
        if (m.isAnnotationPresent(DeleteMapping.class)) return m.getAnnotation(DeleteMapping.class).value();
        return new String[0];
    }

    @Test
    void thereIsNoRecruiterLeaveCollegeEndpoint() {
        for (Class<?> c : new Class<?>[]{RecruiterSelfController.class, RecruiterCollegeController.class, RecruiterDriveController.class}) {
            for (Method m : c.getDeclaredMethods()) {
                assertFalse(Arrays.stream(paths(m)).anyMatch(p -> p.contains("leave")), c.getSimpleName() + "." + m.getName() + " offers a leave");
            }
        }
    }
}
