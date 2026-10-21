package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/** Recruiter phase 1, step 8 (N7): the drive's internal discussion is the placement team's own. */
class DriveInternalNoteServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final DriveInternalNoteService svc = new DriveInternalNoteService(jdbc);

    @Test
    void aNoteIsSavedForTheCollegeAndDrive() {
        svc.add(6, 5, 12, "  Ask them about the bond  ");
        verify(jdbc).update(contains("INSERT INTO drive_internal_note"), any(MapSqlParameterSource.class));
    }

    @Test
    void emptyOrHugeNotesAreRefused() {
        assertThrows(IllegalArgumentException.class, () -> svc.add(6, 5, 12, "   "));
        assertThrows(IllegalArgumentException.class, () -> svc.add(6, 5, 12, "x".repeat(DriveInternalNoteService.MAX_LENGTH + 1)));
        verify(jdbc, never()).update(contains("INSERT"), any(MapSqlParameterSource.class));
    }
}
