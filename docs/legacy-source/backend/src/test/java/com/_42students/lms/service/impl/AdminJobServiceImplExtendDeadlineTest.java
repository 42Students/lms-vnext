package com._42students.lms.service.impl;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * College-admin audit (screen 22, item 22.2): extendApplicationDeadline had no dedicated unit
 * test, only code review + the full suite passing. This covers the one thing that made this
 * action non-trivial to get right: applicationDeadline is DERIVED from the "Application deadline"
 * entry inside importantDates on every save (deriveApplicationDeadlineFromImportantDates), so a
 * naive "set the field directly" implementation would look correct here and then silently revert
 * on the very next unrelated edit. These tests exercise the real move/create/re-derive path, not
 * a mock that would hide that bug.
 */
@ExtendWith(MockitoExtension.class)
class AdminJobServiceImplExtendDeadlineTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private JobApplicationRepository jobApplicationRepository;

    @InjectMocks
    private AdminJobServiceImpl adminJobService;

    private static final Integer JOB_ID = 501;
    private static final Integer COLLEGE_ID = 7;

    @BeforeEach
    void setUp() {
        // updateJobInternal (which extendApplicationDeadline routes through) re-persists via
        // save() — echo back whatever was passed in, same as the real repository would after
        // an in-place update.
        lenient().when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(jobApplicationRepository.countByJobId(anyInt())).thenReturn(0L);
    }

    private Job jobWithImportantDates(List<Object> importantDates, LocalDateTime currentDeadline) {
        Job job = new Job();
        job.setId(JOB_ID);
        job.setCollegeId(COLLEGE_ID);
        job.setJobTitle("Software Engineer");
        job.setIsDeleted(false);
        job.setImportantDates(importantDates);
        job.setApplicationDeadline(currentDeadline);
        return job;
    }

    private Map<String, Object> deadlineEntry(String date) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("label", "Application deadline");
        entry.put("date", date);
        return entry;
    }

    @Nested
    @DisplayName("An existing 'Application deadline' entry")
    class ExistingEntry {

        @Test
        @DisplayName("is moved in place, and applicationDeadline is re-derived to match")
        void movesExistingEntryAndRederivesDeadline() {
            LocalDateTime oldDeadline = LocalDateTime.now().plusDays(1);
            List<Object> importantDates = new ArrayList<>();
            importantDates.add(deadlineEntry(oldDeadline.toString()));
            Job existing = jobWithImportantDates(importantDates, oldDeadline);
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            LocalDateTime newDeadline = LocalDateTime.now().plusDays(30);
            Job result = adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, newDeadline);

            assertEquals(newDeadline, result.getApplicationDeadline());
            @SuppressWarnings("unchecked")
            List<Object> resultDates = (List<Object>) result.getImportantDates();
            assertEquals(1, resultDates.size());
            @SuppressWarnings("unchecked")
            Map<String, Object> onlyEntry = (Map<String, Object>) resultDates.get(0);
            assertEquals(newDeadline.toString(), onlyEntry.get("date"));
            verify(jobRepository).save(any(Job.class));
        }

        @Test
        @DisplayName("matches the label case-insensitively and leaves other entries untouched")
        void matchesLabelCaseInsensitivelyAndPreservesOtherEntries() {
            LocalDateTime oldDeadline = LocalDateTime.now().plusDays(1);
            List<Object> importantDates = new ArrayList<>();
            Map<String, Object> unrelated = new LinkedHashMap<>();
            unrelated.put("label", "Interview round");
            unrelated.put("date", LocalDateTime.now().plusDays(10).toString());
            importantDates.add(unrelated);
            Map<String, Object> deadlineMap = deadlineEntry(oldDeadline.toString());
            // uppercase label: the lookup ("application deadline".equalsIgnoreCase(...)) must
            // still match this.
            deadlineMap.put("label", "APPLICATION DEADLINE");
            importantDates.add(deadlineMap);
            Job existing = jobWithImportantDates(importantDates, oldDeadline);
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            LocalDateTime newDeadline = LocalDateTime.now().plusDays(15);
            Job result = adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, newDeadline);

            assertEquals(newDeadline, result.getApplicationDeadline());
            @SuppressWarnings("unchecked")
            List<Object> resultDates = (List<Object>) result.getImportantDates();
            assertEquals(2, resultDates.size());
            @SuppressWarnings("unchecked")
            Map<String, Object> stillThere = (Map<String, Object>) resultDates.get(0);
            assertEquals("Interview round", stillThere.get("label"));
        }
    }

    @Nested
    @DisplayName("No 'Application deadline' entry yet")
    class NoExistingEntry {

        @Test
        @DisplayName("creates one instead of rejecting the request")
        void createsEntryWhenNoneExists() {
            Job existing = jobWithImportantDates(new ArrayList<>(), null);
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            LocalDateTime newDeadline = LocalDateTime.now().plusDays(20);
            Job result = adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, newDeadline);

            assertEquals(newDeadline, result.getApplicationDeadline());
            @SuppressWarnings("unchecked")
            List<Object> resultDates = (List<Object>) result.getImportantDates();
            assertEquals(1, resultDates.size());
        }

        @Test
        @DisplayName("handles a null importantDates value the same way")
        void handlesNullImportantDates() {
            Job existing = jobWithImportantDates(null, null);
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            LocalDateTime newDeadline = LocalDateTime.now().plusDays(20);
            Job result = adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, newDeadline);

            assertEquals(newDeadline, result.getApplicationDeadline());
        }
    }

    @Nested
    @DisplayName("Guards inherited from the normal update path")
    class Guards {

        @Test
        @DisplayName("rejects a job with no collegeId (org-wide job) the same as any other edit")
        void rejectsOrgWideJob() {
            Job existing = jobWithImportantDates(new ArrayList<>(), null);
            existing.setCollegeId(null);
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            assertThrows(IllegalArgumentException.class, () ->
                    adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, LocalDateTime.now().plusDays(5)));
            verify(jobRepository, never()).save(any(Job.class));
        }

        @Test
        @DisplayName("rejects a job belonging to a different college")
        void rejectsJobFromDifferentCollege() {
            Job existing = jobWithImportantDates(new ArrayList<>(), null);
            existing.setCollegeId(COLLEGE_ID + 1);
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            assertThrows(IllegalArgumentException.class, () ->
                    adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, LocalDateTime.now().plusDays(5)));
        }

        @Test
        @DisplayName("propagates the 'deadline in the past' rejection from the normal derive/validate path")
        void rejectsPastDeadlineViaTheSharedValidation() {
            Job existing = jobWithImportantDates(new ArrayList<>(), LocalDateTime.now().plusDays(1));
            when(jobRepository.findById(JOB_ID)).thenReturn(Optional.of(existing));

            LocalDateTime pastDeadline = LocalDateTime.now().minusDays(1);
            assertThrows(IllegalArgumentException.class, () ->
                    adminJobService.extendApplicationDeadline(JOB_ID, COLLEGE_ID, pastDeadline));
        }
    }
}
