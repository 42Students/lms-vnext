package com._42students.lms.service.tpo;

import com._42students.lms.repository.tpo.CollegePlacementRulesRepository;
import com._42students.lms.repository.tpo.ExternalPlacementRepository;
import com._42students.lms.repository.tpo.JobOfferRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The closed V1 rule set: default is one held offer, and a placed student may still apply if the
 * new CTC clears the college's uplift % over every held offer, or the drive is tagged Dream.
 * See TPO V1 - Locked.docx §9 and the reviewer panel's round-2 resolution on conflict #3/#4.
 */
class PlacementRulesServiceTest {

    private final CollegePlacementRulesRepository rulesRepository = mock(CollegePlacementRulesRepository.class);
    private final JobOfferRepository jobOfferRepository = mock(JobOfferRepository.class);
    private final ExternalPlacementRepository externalPlacementRepository = mock(ExternalPlacementRepository.class);
    private final PlacementRulesService service = new PlacementRulesService(rulesRepository, jobOfferRepository, externalPlacementRepository);

    private void withDefaultRules() {
        when(rulesRepository.findById(1)).thenReturn(Optional.empty());
    }

    @Test void noHeldOffersIsNeverBlocked() {
        withDefaultRules();
        assertFalse(service.isBlockedByHeldOffers(1, List.of(), BigDecimal.valueOf(6), false));
    }

    @Test void newDriveBelowUpliftIsBlockedByAHeldOffer() {
        withDefaultRules();
        // Default max held offers = 1, uplift = 40%. Held 6 LPA, new drive only 7 LPA (<8.4).
        assertTrue(service.isBlockedByHeldOffers(1, List.of(BigDecimal.valueOf(6)), BigDecimal.valueOf(7), false));
    }

    @Test void newDriveMeetingUpliftIsAllowed() {
        withDefaultRules();
        // 6 * 1.4 = 8.4; 8.4 or above clears it.
        assertFalse(service.isBlockedByHeldOffers(1, List.of(BigDecimal.valueOf(6)), BigDecimal.valueOf(8.4), false));
    }

    @Test void dreamTagExemptsEvenBelowUplift() {
        withDefaultRules();
        assertFalse(service.isBlockedByHeldOffers(1, List.of(BigDecimal.valueOf(6)), BigDecimal.valueOf(6.5), true));
    }

    @Test void minimumRespondByNeverEndsOnASunday() {
        withDefaultRules();
        // A Friday 10am + 48h lands on Sunday 10am; the rule must push it to Monday.
        LocalDateTime friday = LocalDateTime.of(2026, 10, 2, 10, 0); // a Friday
        LocalDateTime respondBy = service.minimumRespondBy(1, friday);
        assertEquals(java.time.DayOfWeek.MONDAY, respondBy.getDayOfWeek());
    }
}
