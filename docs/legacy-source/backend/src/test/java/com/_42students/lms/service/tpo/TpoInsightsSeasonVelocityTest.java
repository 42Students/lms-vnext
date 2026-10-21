package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.CollegePlacementRules;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TpoInsightsSeasonVelocityTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final PlacementRulesService rules = mock(PlacementRulesService.class);
    private final TpoInsightsService service = new TpoInsightsService(jdbc, rules);

    @Test
    void comparesTheSameElapsedDayAcrossConsecutiveSeasons() {
        CollegePlacementRules placementRules = new CollegePlacementRules();
        placementRules.setCountsAsPlacedAt("OFFER_RELEASED");
        when(rules.rulesFor(9)).thenReturn(placementRules);

        when(jdbc.queryForList(contains("WHERE id = :s AND college_id = :c"), any(SqlParameterSource.class)))
                .thenReturn(List.of(Map.of(
                        "id", 7L, "name", "2026", "startDate", LocalDate.of(2026, 7, 1),
                        "endDate", LocalDate.of(2027, 3, 31))));
        when(jdbc.queryForList(contains("ORDER BY start_date DESC LIMIT 1"), any(SqlParameterSource.class)))
                .thenReturn(List.of(Map.of(
                        "id", 6L, "name", "2025", "startDate", LocalDate.of(2025, 7, 1),
                        "endDate", LocalDate.of(2026, 3, 31))));

        when(jdbc.queryForObject(contains("COUNT(DISTINCT a.learner_id)"), any(SqlParameterSource.class), org.mockito.ArgumentMatchers.eq(Long.class)))
                .thenReturn(84L, 71L);

        Map<String, Object> velocity = service.seasonVelocity(9, 7L, LocalDate.of(2026, 9, 1));

        assertEquals(62L, velocity.get("elapsedDays"));
        assertEquals(84L, velocity.get("currentPlaced"));
        assertEquals(71L, velocity.get("previousPlaced"));
        assertEquals(13L, velocity.get("deltaPlaced"));
        assertEquals("2025", velocity.get("previousSeason"));
    }

    @Test
    void returnsNoComparisonWhenThereIsNoPreviousSeason() {
        when(jdbc.queryForList(contains("WHERE id = :s AND college_id = :c"), any(SqlParameterSource.class)))
                .thenReturn(List.of(Map.of("id", 7L, "name", "2026", "startDate", LocalDate.of(2026, 7, 1))));
        when(jdbc.queryForList(contains("ORDER BY start_date DESC LIMIT 1"), any(SqlParameterSource.class)))
                .thenReturn(List.of());

        assertEquals(null, service.seasonVelocity(9, 7L, LocalDate.of(2026, 9, 1)));
    }
}
