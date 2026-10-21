package com._42students.lms.service.tpo;

import com._42students.lms.model.Job;
import com._42students.lms.model.JobApplication;
import com._42students.lms.model.tpo.CollegePlacementRules;
import com._42students.lms.model.tpo.ExternalPlacement;
import com._42students.lms.model.tpo.JobOffer;
import com._42students.lms.repository.tpo.CollegePlacementRulesRepository;
import com._42students.lms.repository.tpo.ExternalPlacementRepository;
import com._42students.lms.repository.tpo.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * The closed V1 placement-rules engine: how many offers a student may hold, whether a placed
 * student may still apply (dream-uplift %), and whether a drive's offer is blocked by another
 * held offer. See TPO V1 - Locked.docx §9 and the reviewer panel's resolution on "what counts as
 * placed" (round-2 conflict #3/#4).
 */
@Service
@RequiredArgsConstructor
public class PlacementRulesService {

    private final CollegePlacementRulesRepository rulesRepository;
    private final JobOfferRepository jobOfferRepository;
    private final ExternalPlacementRepository externalPlacementRepository;

    /** For batch overrides (placement_batch.rules_json). Optional so the rules still work alone in unit tests. */
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();

    /** The rules a batch can change for itself; everything else is the college's. */
    public static final java.util.List<String> BATCH_RULE_KEYS = java.util.List.of("countsAsPlacedAt", "maxHeldOffers", "upliftPct", "minResponseHours");

    /** A batch's own changes to the college rules (only the keys it sets), or an empty map. */
    public java.util.Map<String, Object> batchOverride(Long batchId) {
        if (jdbc == null || batchId == null) return java.util.Map.of();
        java.util.List<String> raw = jdbc.queryForList("SELECT CAST(rules_json AS CHAR) FROM placement_batch WHERE batch_id = :b AND rules_json IS NOT NULL",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("b", batchId), String.class);
        if (raw.isEmpty() || raw.get(0) == null) return java.util.Map.of();
        try {
            @SuppressWarnings("unchecked") java.util.Map<String, Object> m = JSON.readValue(raw.get(0), java.util.Map.class);
            java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
            for (String k : BATCH_RULE_KEYS) if (m.get(k) != null) out.put(k, m.get(k));
            return out;
        } catch (Exception e) {
            return java.util.Map.of(); // a damaged override never breaks the college rules
        }
    }

    /** The college rules with a batch's own changes on top. Not saved: a copy. */
    public CollegePlacementRules rulesForBatch(Integer collegeId, Long batchId) {
        CollegePlacementRules base = rulesFor(collegeId);
        java.util.Map<String, Object> o = batchOverride(batchId);
        if (o.isEmpty()) return base;
        CollegePlacementRules r = new CollegePlacementRules();
        r.setCollegeId(collegeId);
        r.setCountsAsPlacedAt(o.get("countsAsPlacedAt") != null ? String.valueOf(o.get("countsAsPlacedAt")) : base.getCountsAsPlacedAt());
        r.setMaxHeldOffers(o.get("maxHeldOffers") != null ? ((Number) o.get("maxHeldOffers")).intValue() : base.getMaxHeldOffers());
        r.setUpliftPct(o.get("upliftPct") != null ? ((Number) o.get("upliftPct")).intValue() : base.getUpliftPct());
        r.setMinResponseHours(o.get("minResponseHours") != null ? ((Number) o.get("minResponseHours")).intValue() : base.getMinResponseHours());
        return r;
    }

    /** The batch of a learner (their class's batch), or null. */
    public Long batchOf(Integer learnerId) {
        if (jdbc == null || learnerId == null) return null;
        java.util.List<Long> b = jdbc.queryForList("SELECT c.batch_id FROM learner l JOIN class c ON c.id = l.class_id WHERE l.id = :l",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", learnerId), Long.class);
        return b.isEmpty() ? null : b.get(0);
    }

    /** The rules that apply to one student: their batch's, else the college's. */
    public CollegePlacementRules rulesForLearner(Integer learnerId, Integer collegeId) {
        return rulesForBatch(collegeId, batchOf(learnerId));
    }

    public CollegePlacementRules rulesFor(Integer collegeId) {
        return rulesRepository.findById(collegeId).orElseGet(() -> {
            CollegePlacementRules r = new CollegePlacementRules();
            r.setCollegeId(collegeId);
            return r;
        });
    }

    /** Held offers = RELEASED (not yet responded) or ACCEPTED. Both count toward the max. */
    public List<JobOffer> heldOffers(Integer applicationLearnerId, List<JobOffer> allOffersForLearner) {
        return allOffersForLearner.stream()
                .filter(o -> "RELEASED".equals(o.getStatus()) || "ACCEPTED".equals(o.getStatus()))
                .toList();
    }

    /**
     * Would offering this drive's CTC to a student already holding `heldCtc` be blocked?
     * Blocked unless the new drive's CTC clears the uplift % over every held offer, or the
     * drive is tagged Dream/Super-dream (an explicit college exception).
     */
    public boolean isBlockedByHeldOffers(Integer collegeId, List<BigDecimal> heldCtcs, BigDecimal candidateCtc, boolean driveIsDream) {
        return isBlockedByHeldOffers(rulesFor(collegeId), heldCtcs, candidateCtc, driveIsDream);
    }

    /** The same check under one student's rules (their batch may have its own). */
    public boolean isBlockedByHeldOffers(Integer collegeId, Integer learnerId, List<BigDecimal> heldCtcs, BigDecimal candidateCtc, boolean driveIsDream) {
        return isBlockedByHeldOffers(rulesForLearner(learnerId, collegeId), heldCtcs, candidateCtc, driveIsDream);
    }

    private boolean isBlockedByHeldOffers(CollegePlacementRules rules, List<BigDecimal> heldCtcs, BigDecimal candidateCtc, boolean driveIsDream) {
        if (heldCtcs.isEmpty()) return false;
        if (heldCtcs.size() >= rules.getMaxHeldOffers() && !driveIsDream) {
            // Already at or over the max held offers; only a Dream drive is exempt.
            BigDecimal highestHeld = heldCtcs.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            if (candidateCtc == null) return true;
            BigDecimal threshold = highestHeld.multiply(BigDecimal.valueOf(100 + rules.getUpliftPct())).divide(BigDecimal.valueOf(100));
            return candidateCtc.compareTo(threshold) < 0;
        }
        return false;
    }

    public java.time.LocalDateTime minimumRespondBy(Integer collegeId, java.time.LocalDateTime from) {
        return minimumRespondBy(rulesFor(collegeId), from);
    }

    public java.time.LocalDateTime minimumRespondBy(Integer collegeId, Integer learnerId, java.time.LocalDateTime from) {
        return minimumRespondBy(rulesForLearner(learnerId, collegeId), from);
    }

    private java.time.LocalDateTime minimumRespondBy(CollegePlacementRules rules, java.time.LocalDateTime from) {
        java.time.LocalDateTime candidate = from.plusHours(rules.getMinResponseHours());
        // Never end on a Sunday: push to Monday same time.
        if (candidate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            candidate = candidate.plusDays(1);
        }
        return candidate;
    }

    /**
     * Student V1 §"Placement rules page": the same sentence template Settings shows the TPO
     * (src/pages/tpo/settings.js RulesTab preview), with real numbers, for the student to read.
     */
    public String summarySentence(Integer collegeId) {
        return summarySentence(rulesFor(collegeId));
    }

    /** The sentence for one student: their batch's rules. */
    public String summarySentenceFor(Integer learnerId, Integer collegeId) {
        return summarySentence(rulesForLearner(learnerId, collegeId));
    }

    /**
     * The rules as a student reads them, one point each, in plain words (the rules page was one paragraph written for the TPO:
     * "A student counts as placed..."). Each point: a short title and what it means for the student.
     */
    public List<java.util.Map<String, String>> studentPoints(CollegePlacementRules r) {
        boolean onAccept = "OFFER_ACCEPTED".equals(r.getCountsAsPlacedAt());
        int held = r.getMaxHeldOffers() == null ? 1 : r.getMaxHeldOffers();
        int uplift = r.getUpliftPct() == null ? 0 : r.getUpliftPct();
        int hours = r.getMinResponseHours() == null ? 48 : r.getMinResponseHours();
        List<java.util.Map<String, String>> out = new ArrayList<>();
        out.add(point("When you count as placed",
                onAccept ? "When you accept an offer. An offer you have not accepted yet does not count."
                        : "As soon as a company releases an offer to you, even before you accept it."));
        out.add(point("Offers you can hold",
                (held == 1 ? "One offer at a time." : "Up to " + held + " offers at a time.")
                        + " Before you accept, you see exactly which of your other offers and applications it would end."));
        out.add(point("Applying after you are placed",
                uplift > 0 ? "You can still apply to drives that pay at least " + uplift + "% more than your offer, and to any drive marked Dream."
                        : "You can still apply to drives that pay more than your offer, and to any drive marked Dream."));
        out.add(point("Time to answer an offer",
                "You get at least " + hours + " hours to accept or decline. An offer you do not answer in time expires."));
        out.add(point("Internships",
                "Internship offers do not count as placed, so you can keep applying to full-time drives."));
        out.add(point("Showing up",
                "Attend every round you are booked for. If you cannot make it, ask to reschedule before the day. The placement cell can bar students who miss rounds from later drives."));
        return out;
    }

    private static java.util.Map<String, String> point(String title, String text) {
        return java.util.Map.of("title", title, "text", text);
    }

    private String summarySentence(CollegePlacementRules r) {
        String placedAt = "OFFER_ACCEPTED".equals(r.getCountsAsPlacedAt()) ? "accepted" : "released";
        return String.format(
                "A student counts as placed when the offer is %s. They can hold up to %d %s. Once placed, they can "
                        + "apply again only for a CTC at least %d%% higher, or a Dream drive. Offers give %d hours to respond.",
                placedAt, r.getMaxHeldOffers(), r.getMaxHeldOffers() == 1 ? "offer" : "offers",
                r.getUpliftPct(), r.getMinResponseHours());
    }

    /**
     * The personal line the spec asks for: "if you accept this 6 LPA offer, you can still apply
     * to 8.4 LPA and above, or Dream drives." Null when the student holds no released/accepted
     * offer and no verified off-campus placement — the generic rules above are all there is to
     * say. A verified off-campus placement (Student V1 §5, "counted as placed under the same
     * rules") counts identically to an on-campus offer here, since it caps future eligibility the
     * same way.
     */
    public String personalNote(Integer learnerId, Integer collegeId) {
        List<BigDecimal> held = new ArrayList<>();
        java.util.Set<Integer> internshipApps = nonCountingApplications(learnerId);
        boolean anyAccepted = false;
        for (JobOffer o : jobOfferRepository.findByLearnerId(learnerId)) {
            if (internshipApps.contains(o.getApplicationId())) continue; // an offer of a type that never counts as placed (Internship)
            if ("RELEASED".equals(o.getStatus()) || "ACCEPTED".equals(o.getStatus())) {
                if ("ACCEPTED".equals(o.getStatus())) anyAccepted = true;
                held.add(o.getCtcLpa() == null ? BigDecimal.ZERO : o.getCtcLpa());
            }
        }
        boolean highestIsExternal = false;
        BigDecimal highestExternal = null;
        for (ExternalPlacement e : externalPlacementRepository.findActiveForLearner(learnerId)) {
            BigDecimal ctc = e.getCtcLpa() == null ? BigDecimal.ZERO : e.getCtcLpa();
            held.add(ctc);
            if (highestExternal == null || ctc.compareTo(highestExternal) > 0) highestExternal = ctc;
        }
        if (held.isEmpty()) return null;
        CollegePlacementRules r = rulesForLearner(learnerId, collegeId);
        BigDecimal highest = held.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        if (highestExternal != null && highestExternal.compareTo(highest) == 0) highestIsExternal = true;
        // Shown to two decimals, rounded up, so a student never reads "₹4.704 LPA" or applies to a drive just under the bar.
        BigDecimal threshold = highest.multiply(BigDecimal.valueOf(100 + r.getUpliftPct()))
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.CEILING);
        // Student UX audit, 20 Oct 2026: "Now that it's released, you can still apply" read oddly on an accepted offer.
        String noun = highestIsExternal ? "You're recorded as placed with a verified offer of" : "You hold an offer of";
        String then = highestIsExternal || anyAccepted || !"OFFER_ACCEPTED".equals(r.getCountsAsPlacedAt())
                ? "From now on you can apply only to" : "Once you accept it, you can apply only to";
        return String.format("%s ₹%s LPA. %s drives paying ₹%s LPA or more, or any drive tagged Dream.",
                noun, stripTrailingZeros(highest), then, stripTrailingZeros(threshold));
    }

    /** Applications of this learner to drives whose offers never count as placed (Internship, or a college type answered No): never held offers either. */
    public java.util.Set<Integer> nonCountingApplications(Integer learnerId) {
        if (jdbc == null || learnerId == null) return java.util.Set.of();
        return new java.util.HashSet<>(jdbc.queryForList("SELECT a.id FROM job_application a JOIN job j ON j.id = a.job_id WHERE a.learner_id = :l AND j.counts_as_placed = 0",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("l", learnerId), Integer.class));
    }

    private static String stripTrailingZeros(BigDecimal v) {
        return v.stripTrailingZeros().toPlainString();
    }
}
