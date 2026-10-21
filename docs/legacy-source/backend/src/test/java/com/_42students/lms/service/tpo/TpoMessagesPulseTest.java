package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 13 Oct 2026: live conversations. The pulse changes with a new message or a read, and covers only the caller's threads. */
class TpoMessagesPulseTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoMessagesService messages = new TpoMessagesService(jdbc, mock(TpoAuditService.class));

    @Test
    void theVersionMovesWithNewMessagesAndReads() {
        when(jdbc.queryForMap(anyString(), any(MapSqlParameterSource.class))).thenReturn(Map.of("lastId", 41, "readCount", 3, "total", 9));
        assertEquals("41.3.9", messages.pulse(6, null));
    }

    @Test
    void aRecruiterSeesOnlyTheirOwnThreadsAndTheCollegeAll() {
        when(jdbc.queryForMap(anyString(), any(MapSqlParameterSource.class))).thenReturn(Map.of("lastId", 0, "readCount", 0, "total", 0));
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        messages.pulse(6, 2L);
        messages.pulse(6, null);
        verify(jdbc, org.mockito.Mockito.times(2)).queryForMap(sql.capture(), any(MapSqlParameterSource.class));
        assertTrue(sql.getAllValues().get(0).contains("t.recruiter_id = :h"));
        assertFalse(sql.getAllValues().get(1).contains("t.recruiter_id"));
        assertTrue(sql.getAllValues().get(1).contains("t.college_id = :c"));
    }
}
