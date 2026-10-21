package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PlacementOutcomeResolveTest {

    private static String key(boolean on, boolean off, String[] reg, boolean debarred, boolean applied) {
        return PlacementOutcomeService.resolve(on, off, reg, debarred, applied).key();
    }

    @Test
    void placedWinsThenOffCampusThenTheChoiceThenDebarredThenSeeking() {
        assertEquals("PLACED_ON_CAMPUS", key(true, true, new String[]{"HIGHER_STUDIES", null, null}, true, true));
        assertEquals("PLACED_OFF_CAMPUS", key(false, true, new String[]{"NOT_INTERESTED", null, null}, false, false));
        assertEquals("HIGHER_STUDIES", key(false, false, new String[]{"HIGHER_STUDIES", null, null}, true, true));
        assertEquals("DEBARRED", key(false, false, new String[]{"PLACEMENTS", null, null}, true, true));
        assertEquals("SEEKING", key(false, false, new String[]{"PLACEMENTS", null, null}, false, false));
        assertEquals("SEEKING", key(false, false, null, false, true), "applied to a drive counts as taking part");
        assertEquals("NOT_REGISTERED", key(false, false, null, false, false));
    }

    @Test
    void theLabelAndDetailTravelWithTheChoice() {
        var o = PlacementOutcomeService.resolve(false, false, new String[]{"ENTREPRENEURSHIP", "Family business", "Textiles"}, false, false);
        assertEquals("Entrepreneurship / self-employed", o.label());
        assertEquals("Family business", o.customLabel());
        assertEquals("Textiles", o.detail());
    }
}
