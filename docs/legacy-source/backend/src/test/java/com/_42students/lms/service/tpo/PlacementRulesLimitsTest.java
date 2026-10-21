package com._42students.lms.service.tpo;

import com._42students.lms.repository.tpo.CollegePlacementRulesRepository;
import com._42students.lms.repository.tpo.CollegeWhatCompaniesSeeRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

/** The college's placement rules have the same limits as a batch's: they took any value (0 offers held blocked every release). */
class PlacementRulesLimitsTest {
    private final TpoSettingsService service = new TpoSettingsService(mock(CollegePlacementRulesRepository.class), mock(CollegeWhatCompaniesSeeRepository.class));

    @Test
    void impossibleRulesAreRefusedInWords() {
        assertEquals("Offers a student can hold must be 1 to 5",
                assertThrows(IllegalArgumentException.class, () -> service.saveRules(6, null, 0, null, null)).getMessage());
        assertThrows(IllegalArgumentException.class, () -> service.saveRules(6, "SOMETIMES", null, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.saveRules(6, null, null, -5, null));
        assertThrows(IllegalArgumentException.class, () -> service.saveRules(6, null, null, null, 2));
    }
}
