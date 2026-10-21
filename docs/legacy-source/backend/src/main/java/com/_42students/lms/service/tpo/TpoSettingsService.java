package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.CollegePlacementRules;
import com._42students.lms.model.tpo.CollegeWhatCompaniesSee;
import com._42students.lms.repository.tpo.CollegePlacementRulesRepository;
import com._42students.lms.repository.tpo.CollegeWhatCompaniesSeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TpoSettingsService {

    private final CollegePlacementRulesRepository rulesRepository;
    private final CollegeWhatCompaniesSeeRepository whatCompaniesSeeRepository;

    public CollegePlacementRules rules(Integer collegeId) {
        return rulesRepository.findById(collegeId).orElseGet(() -> {
            CollegePlacementRules r = new CollegePlacementRules();
            r.setCollegeId(collegeId);
            return r;
        });
    }

    @Transactional
    public CollegePlacementRules saveRules(Integer collegeId, String countsAsPlacedAt, Integer maxHeldOffers,
                                            Integer upliftPct, Integer minResponseHours) {
        // The same limits a batch's own rules have (PlacementEligibilityService.saveBatchRules): the college rules took any value,
        // so 0 offers held blocked every release, and any text for "counts as placed" silently read as "released".
        if (countsAsPlacedAt != null && !java.util.List.of("OFFER_RELEASED", "OFFER_ACCEPTED").contains(countsAsPlacedAt)) {
            throw new IllegalArgumentException("Counts as placed must be when the offer is released or accepted");
        }
        if (maxHeldOffers != null && (maxHeldOffers < 1 || maxHeldOffers > 5)) throw new IllegalArgumentException("Offers a student can hold must be 1 to 5");
        if (upliftPct != null && (upliftPct < 0 || upliftPct > 200)) throw new IllegalArgumentException("The uplift must be 0 to 200%");
        if (minResponseHours != null && (minResponseHours < 12 || minResponseHours > 168)) throw new IllegalArgumentException("Time to respond must be 12 to 168 hours");
        CollegePlacementRules r = rules(collegeId);
        if (countsAsPlacedAt != null) r.setCountsAsPlacedAt(countsAsPlacedAt);
        if (maxHeldOffers != null) r.setMaxHeldOffers(maxHeldOffers);
        if (upliftPct != null) r.setUpliftPct(upliftPct);
        if (minResponseHours != null) r.setMinResponseHours(minResponseHours);
        r.setUpdatedAt(LocalDateTime.now());
        return rulesRepository.save(r);
    }

    public CollegeWhatCompaniesSee whatCompaniesSee(Integer collegeId) {
        return whatCompaniesSeeRepository.findById(collegeId).orElseGet(() -> {
            CollegeWhatCompaniesSee w = new CollegeWhatCompaniesSee();
            w.setCollegeId(collegeId);
            return w;
        });
    }

    @Transactional
    public CollegeWhatCompaniesSee saveWhatCompaniesSee(CollegeWhatCompaniesSee incoming) {
        incoming.setUpdatedAt(LocalDateTime.now());
        return whatCompaniesSeeRepository.save(incoming);
    }
}
