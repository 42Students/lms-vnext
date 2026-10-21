package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.ExternalPlacement;
import com._42students.lms.model.tpo.JobOffer;
import com._42students.lms.model.tpo.JobRoleOption;
import com._42students.lms.repository.JobApplicationRepository;
import com._42students.lms.repository.tpo.ExternalPlacementRepository;
import com._42students.lms.repository.tpo.JobOfferRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Decides, when a student accepts an offer, which of their other open applications the college's placement rules still allow
 * (TPO V1 - Locked.docx §1 "What updates automatically": withdrawn from the drives the rules now block, told "Placed elsewhere").
 *
 * The legacy accept cascade withdraws every other application. This policy is consulted for each one and can say "keep it open":
 * when the student holds offers tracked by TPO V1 and the college's rules (held-offer limit, the uplift %, Dream drives) still
 * admit this drive. Anything without a TPO offer behind it gets the legacy behaviour unchanged, so colleges and flows that do not
 * use TPO V1 are not affected.
 */
@Service
@RequiredArgsConstructor
public class PlacementCascadePolicy {

    private final PlacementRulesService rules;
    private final JobOfferRepository offerRepository;
    private final JobApplicationRepository applicationRepository;
    private final ExternalPlacementRepository externalPlacementRepository;
    private final ObjectMapper objectMapper;

    /** True when {@code other} should stay open after {@code accepted} was accepted. */
    public boolean keepsOpen(JobApplication accepted, JobApplication other) {
        Job job = other.getJob();
        if (job == null || job.getCollegeId() == null || accepted.getLearner() == null) return false;
        List<BigDecimal> held = heldCtcs(accepted.getLearner().getId());
        if (held.isEmpty()) return false; // nothing tracked by TPO V1: keep the legacy behaviour
        boolean dream = job.getCategory() != null && job.getCategory().toUpperCase().contains("DREAM");
        if (Boolean.FALSE.equals(job.getCountsAsPlaced())) return true; // a type that never counts as placed (Internship) is never blocked by held offers
        return !rules.isBlockedByHeldOffers(job.getCollegeId(), accepted.getLearner().getId(), held, highestCtc(job), dream);
    }

    /**
     * Why a student who holds offers may not apply to this drive under the college's rules (the same rule as the accept cascade
     * and offer release), or null when they may. Applying was not checked at all, so a placed student could apply for a lower
     * CTC and only be told when an offer could not be released (night audit 13 Oct 2026).
     */
    public String applyBlockedReason(Integer learnerId, Job job) {
        if (job == null || job.getCollegeId() == null || learnerId == null) return null;
        if (Boolean.FALSE.equals(job.getCountsAsPlaced())) return null; // an internship is never held against anyone
        List<BigDecimal> held = heldCtcs(learnerId);
        if (held.isEmpty()) return null;
        boolean dream = job.getCategory() != null && job.getCategory().toUpperCase().contains("DREAM");
        if (!rules.isBlockedByHeldOffers(job.getCollegeId(), learnerId, held, highestCtc(job), dream)) return null;
        com._42students.lms.model.tpo.CollegePlacementRules r = rules.rulesForLearner(learnerId, job.getCollegeId());
        int max = r.getMaxHeldOffers() == null ? 1 : r.getMaxHeldOffers();
        int uplift = r.getUpliftPct() == null ? 0 : r.getUpliftPct();
        return "You already hold " + (held.size() == 1 ? "an offer" : held.size() + " offers") + ". Your college's rules let you apply now only to a Dream drive"
                + (uplift > 0 ? " or for a CTC at least " + uplift + "% higher than your best offer" : "")
                + (max > 1 ? ", and only while you hold fewer than " + max + " offers" : "") + ".";
    }

    /**
     * CTCs of the offers a student holds: released (not yet answered) or accepted, plus any
     * placement-cell-verified off-campus offer (Student V1 §5 "counted as placed under the same
     * rules") — an external placement is exactly as binding on future applications as an
     * on-campus one, so it counts here identically.
     */
    List<BigDecimal> heldCtcs(Integer learnerId) {
        List<BigDecimal> out = new ArrayList<>();
        for (JobApplication a : applicationRepository.findByLearnerId(learnerId)) {
            if (a.getJob() != null && Boolean.FALSE.equals(a.getJob().getCountsAsPlaced())) continue; // offers that never count as placed are never held offers
            for (JobOffer o : offerRepository.findByApplicationId(a.getId())) {
                if ("RELEASED".equals(o.getStatus()) || "ACCEPTED".equals(o.getStatus())) {
                    out.add(o.getCtcLpa() == null ? BigDecimal.ZERO : o.getCtcLpa());
                }
            }
        }
        for (ExternalPlacement e : externalPlacementRepository.findActiveForLearner(learnerId)) {
            out.add(e.getCtcLpa() == null ? BigDecimal.ZERO : e.getCtcLpa());
        }
        return out;
    }

    /** The best pay a drive offers, from its role options. Null when the drive states none. */
    BigDecimal highestCtc(Job job) {
        if (job.getRoleOptionsJson() == null) return null;
        try {
            JobRoleOption[] options = objectMapper.convertValue(job.getRoleOptionsJson(), JobRoleOption[].class);
            BigDecimal best = null;
            for (JobRoleOption o : options) if (o.getCtcLpa() != null && (best == null || o.getCtcLpa().compareTo(best) > 0)) best = o.getCtcLpa();
            return best;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
