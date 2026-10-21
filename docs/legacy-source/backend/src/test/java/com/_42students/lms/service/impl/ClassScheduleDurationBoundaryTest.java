package com._42students.lms.service.impl;

import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/** Shared by schedule create() and update(); prevent fractional-hour truncation. */
class ClassScheduleDurationBoundaryTest {
    private static final LocalDateTime START = LocalDateTime.of(2026, 9, 21, 9, 0);

    private void validate(LocalDateTime start, LocalDateTime end) throws Exception {
        ClassScheduleServiceImpl service = new ClassScheduleServiceImpl();
        Method check = ClassScheduleServiceImpl.class.getDeclaredMethod(
                "requireReasonableDuration", LocalDateTime.class, LocalDateTime.class);
        check.setAccessible(true);
        check.invoke(service, start, end);
    }

    private void rejectDuration(LocalDateTime end) throws Exception {
        ClassScheduleServiceImpl service = new ClassScheduleServiceImpl();
        Method check = ClassScheduleServiceImpl.class.getDeclaredMethod(
                "requireReasonableDuration", LocalDateTime.class, LocalDateTime.class);
        check.setAccessible(true);
        InvocationTargetException thrown = assertThrows(InvocationTargetException.class,
                () -> check.invoke(service, START, end));
        assertInstanceOf(IllegalArgumentException.class, thrown.getCause());
        assertTrue(thrown.getCause().getMessage().contains("12 hours"));
    }

    @Test
    void exactlyTwelveHoursIsAllowed() throws Exception {
        assertDoesNotThrow(() -> validate(START, START.plusHours(12)));
    }

    @Test
    void elevenHoursFiftyNineMinutesIsAllowed() throws Exception {
        assertDoesNotThrow(() -> validate(START, START.plusHours(11).plusMinutes(59)));
    }

    @Test
    void twelveHoursAndOneSecondIsRejected() throws Exception {
        rejectDuration(START.plusHours(12).plusSeconds(1));
    }

    @Test
    void twelveHoursAndFiftyNineMinutesIsRejected() throws Exception {
        rejectDuration(START.plusHours(12).plusMinutes(59));
    }

    @Test
    void thirteenHoursIsRejected() throws Exception {
        rejectDuration(START.plusHours(13));
    }
}
