package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** BE-0121: a person can't end up with two saved views of the same name on one table. */
class SavedViewUniqueNameTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoSettingsHubService service = new TpoSettingsHubService(jdbc, null, null);

    @Test
    void theInsertOnlyLandsWhenTheNameIsFree() {
        when(jdbc.update(anyString(), any(MapSqlParameterSource.class))).thenReturn(1);
        service.saveView(6, 7, "STUDENTS", " Not ready CSE ", Map.of("branch", "CSE"));
        verify(jdbc).update(contains("WHERE NOT EXISTS"), argThat((MapSqlParameterSource q) -> "Not ready CSE".equals(q.getValue("n"))));
    }

    @Test
    void aSecondViewWithTheSameNameIsRefused() {
        when(jdbc.update(anyString(), any(MapSqlParameterSource.class))).thenReturn(0);
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> service.saveView(6, 7, "STUDENTS", "Not ready CSE", Map.of()));
        assertTrue(e.getMessage().startsWith("You already have a view called"));
    }
}
