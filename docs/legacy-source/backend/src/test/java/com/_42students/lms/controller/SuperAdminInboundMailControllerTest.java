package com._42students.lms.controller;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 13 Oct 2026: Super Admin > Inbound mail lists every email to 42lms.com that still needs a person, and marks them done. */
class SuperAdminInboundMailControllerTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final SuperAdminInboundMailController controller = new SuperAdminInboundMailController(jdbc);

    @Test
    void openShowsWhatStillNeedsSomeoneAndSearchIsEscaped() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of());
        when(jdbc.queryForObject(anyString(), any(MapSqlParameterSource.class), eq(Long.class))).thenReturn(3L);
        Map<String, Object> out = controller.list("OPEN", "50%_off", 0);
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<MapSqlParameterSource> p = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).queryForList(sql.capture(), p.capture());
        assertTrue(sql.getValue().contains("e.handled_at IS NULL AND e.status <> 'POSTED'"), "posted replies are already in their conversation");
        assertEquals("%50\\%\\_off%", p.getValue().getValue("q"));
        assertEquals(3L, out.get("open"));
    }

    @Test
    void markingDoneStampsTheTime() {
        when(jdbc.update(anyString(), any(MapSqlParameterSource.class))).thenReturn(1);
        assertEquals(200, controller.done(7L, true).getStatusCode().value());
        verify(jdbc).update(contains("handled_at = UTC_TIMESTAMP()"), any(MapSqlParameterSource.class));
    }

    @Test
    void onlySuperAdmins() throws Exception {
        String config = Files.readString(Path.of("src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java"));
        assertTrue(config.contains(".antMatchers(\"/api/v1/superadmin/inbound-mail\", \"/api/v1/superadmin/inbound-mail/**\").hasRole(\"SUPER_ADMIN\")"));
    }
}
