package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.CollegePlacementRules;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TpoInsightsCompensationTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final PlacementRulesService rules = mock(PlacementRulesService.class);
    private final TpoInsightsService service = new TpoInsightsService(jdbc, rules);

    @Test
    void compensationSnapshotUsesBestOfferPerStudentAndBuildsStableBands() {
        CollegePlacementRules placementRules = new CollegePlacementRules();
        placementRules.setCountsAsPlacedAt("OFFER_RELEASED");
        when(rules.rulesFor(9)).thenReturn(placementRules);
        when(jdbc.queryForList(contains("MAX(o.ctc_lpa) AS ctc"), any(org.springframework.jdbc.core.namedparam.SqlParameterSource.class)))
                .thenReturn(List.of(
                        Map.of("learnerId", 1, "ctc", 3.5),
                        Map.of("learnerId", 2, "ctc", 5.0),
                        Map.of("learnerId", 3, "ctc", 8.0),
                        Map.of("learnerId", 4, "ctc", 12.0),
                        Map.of("learnerId", 5, "ctc", 24.0)
                ));

        Map<String, Object> snapshot = service.compensationSnapshot(9, 7L);

        assertEquals(24.0, snapshot.get("highest"));
        assertEquals(8.0, snapshot.get("median"));
        assertEquals(10.5, snapshot.get("average"));
        assertEquals(5, snapshot.get("students"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> bands = (List<Map<String, Object>>) snapshot.get("bands");
        assertEquals(List.of(1L, 1L, 1L, 1L, 1L), bands.stream().map(b -> b.get("count")).toList());
    }
}
