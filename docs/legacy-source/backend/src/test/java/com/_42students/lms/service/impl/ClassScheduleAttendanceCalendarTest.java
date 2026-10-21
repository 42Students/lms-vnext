package com._42students.lms.service.impl;

import com._42students.lms.dto.response.AttendanceDetailsResponseDTO;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.model.Attend;
import com._42students.lms.model.ClassSchedule;
import com._42students.lms.repository.AttendanceRepository;
import com._42students.lms.repository.ClassScheduleRepository;
import com._42students.lms.service.LearnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

/** A dated schedule must never be repeated across every weekday in an attendance report. */
class ClassScheduleAttendanceCalendarTest {
    private ClassScheduleServiceImpl service;
    private ClassScheduleRepository schedules;
    private AttendanceRepository attendance;
    private LearnerService learners;

    @BeforeEach
    void setUp() {
        service = new ClassScheduleServiceImpl();
        schedules = mock(ClassScheduleRepository.class);
        attendance = mock(AttendanceRepository.class);
        learners = mock(LearnerService.class);
        service.classScheduleRepository = schedules;
        service.attendanceRepository = attendance;
        service.studentService = learners;
    }

    private ClassSchedule session(int id, String start) {
        ClassSchedule schedule = new ClassSchedule();
        schedule.setId(id);
        schedule.setClassId(3);
        schedule.setCourseId(5);
        schedule.setStartTime(start);
        schedule.setEndTime(start.substring(0, 11) + "10:00:00");
        return schedule;
    }

    private List<AttendanceDetailsResponseDTO> report(List<ClassSchedule> sessions, String from, String to,
                                                        List<Attend> absences) {
        Date first = Date.valueOf(from);
        Date last = Date.valueOf(to);
        when(schedules.getClassScheduleByClassRangeAnyFaculty(3, 5, first, last)).thenReturn(sessions);
        when(attendance.getAttendanceByClassScheduleIds(anyList())).thenReturn(absences);
        LearnerResponseDTO learner = new LearnerResponseDTO();
        learner.setLearnerId(42);
        learner.setFirstName("Ada");
        learner.setLastName("Lovelace");
        when(learners.getStudentDetailsByClassId(3)).thenReturn(List.of(learner));
        return service.getAttendanceDetailsByDateRangeForAdmin(3, 5, first, last);
    }

    private Set<String> days(AttendanceDetailsResponseDTO result) {
        return result.getAttendanceList().stream()
                .flatMap(day -> day.keySet().stream())
                .collect(Collectors.toSet());
    }

    @Test
    void oneMondaySessionDoesNotFabricateTuesdayThroughFridayAttendance() {
        List<AttendanceDetailsResponseDTO> result = report(
                List.of(session(9, "2026-09-21 09:00:00")), "2026-09-21", "2026-09-25", List.of());
        assertEquals(1, result.size());
        assertEquals(Set.of("2026-09-21"), days(result.get(0)));
        assertEquals(1, result.get(0).getAttendanceList().size());
        verify(attendance).getAttendanceByClassScheduleIds(List.of(9));
    }

    @Test
    void realSundaySessionIsIncludedRatherThanDiscarded() {
        List<AttendanceDetailsResponseDTO> result = report(
                List.of(session(10, "2026-09-20 09:00:00")), "2026-09-20", "2026-09-20", List.of());
        assertEquals(1, result.size());
        assertEquals(Set.of("2026-09-20"), days(result.get(0)));
        assertEquals(1, result.get(0).getAttendanceList().size());
    }

    @Test
    void absenceIsAppliedOnlyToTheActualScheduledDate() {
        Attend absent = new Attend();
        absent.setClassScheduleId(9);
        absent.setStudentId("42");
        List<AttendanceDetailsResponseDTO> result = report(
                List.of(session(9, "2026-09-21 09:00:00"), session(10, "2026-09-23 09:00:00")),
                "2026-09-21", "2026-09-25", List.of(absent));
        assertEquals(1, result.size());
        AttendanceDetailsResponseDTO learner = result.get(0);
        assertEquals(Set.of("2026-09-21", "2026-09-23"), days(learner));
        assertEquals(2, learner.getAttendanceList().size());
        Map<String, String> monday = learner.getAttendanceList().stream()
                .filter(row -> row.containsKey("2026-09-21"))
                .findFirst().orElseThrow().get("2026-09-21");
        Map<String, String> wednesday = learner.getAttendanceList().stream()
                .filter(row -> row.containsKey("2026-09-23"))
                .findFirst().orElseThrow().get("2026-09-23");
        assertEquals("A", monday.get("Attendance"));
        assertEquals("P", wednesday.get("Attendance"));
    }

    @Test
    void outOfRangeRowsReturnedByRepositoryCannotCreatePhantomSlots() {
        List<AttendanceDetailsResponseDTO> result = report(
                List.of(session(11, "2026-09-18 09:00:00")), "2026-09-21", "2026-09-25", List.of());
        assertTrue(result.isEmpty());
        verify(attendance, never()).getAttendanceByClassScheduleIds(anyList());
    }
}
