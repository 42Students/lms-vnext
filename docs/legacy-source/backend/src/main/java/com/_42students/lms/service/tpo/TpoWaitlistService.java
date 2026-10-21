package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.JobOffer;
import com._42students.lms.repository.tpo.JobOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * "Offer to next waitlisted" (TPO V1 - Locked.docx §5 Offers): after a decline or expiry, the seat goes to the
 * next student on the ranked waitlist, skipping anyone the placement rules block ("2 skipped: placed elsewhere").
 * The new offer is created as SELECTED, so the TPO still verifies and releases it like any other.
 */
@Service
@RequiredArgsConstructor
public class TpoWaitlistService {

    private final NamedParameterJdbcTemplate jdbc;
    private final JobOfferRepository jobOfferRepository;
    private final PlacementRulesService placementRulesService;
    private final TpoOfferService offerService;

    @Transactional
    public Map<String, Object> offerToNext(Long sourceOfferId, Integer actorId) {
        JobOffer source = jobOfferRepository.findById(sourceOfferId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (!Set.of("DECLINED", "EXPIRED", "WITHDRAWN", "REVOKED").contains(source.getStatus())) {
            throw new IllegalStateException("The seat is only free after an offer is declined, expired or withdrawn");
        }
        // A freed seat is given once: the source offer remembers who got it (pressing it again used to give the same seat away again).
        if (source.getCascadeId() != null && source.getCascadeId().startsWith(SEAT_GIVEN)) {
            throw new IllegalStateException("This seat was already offered to the next student on the waitlist");
        }
        RankedWaitlist ranked = rankedWaitlist(source);
        for (Candidate c : ranked.candidates) {
            if (c.reason != null) continue;
            JobOffer next = offerService.recordSelection(c.applicationId, source.getRoleOptionName(), source.getCtcLpa(),
                    source.getKind(), actorId, "TPO");
            source.setCascadeId(SEAT_GIVEN + next.getId());
            jobOfferRepository.save(source);
            return Map.of("offered", true, "applicationId", c.applicationId, "name", c.name, "offerId", next.getId(), "skipped", ranked.skippedSoFar(c));
        }
        return Map.of("offered", false, "skipped", ranked.allSkipped());
    }

    /**
     * Placements UX pass, "Waitlist Promotion Preview": the exact same ranking and placement-rules
     * skip logic offerToNext already runs, but read-only - so a TPO can see who is actually next
     * (and why anyone ahead of them was skipped) before deciding to free the seat at all. Reusing
     * the shared ranking method keeps the preview and the real action from ever disagreeing.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> previewOfferToNext(Long sourceOfferId) {
        JobOffer source = jobOfferRepository.findById(sourceOfferId).orElseThrow(() -> new IllegalArgumentException("Not found"));
        RankedWaitlist ranked = rankedWaitlist(source);
        List<Map<String, Object>> candidates = new ArrayList<>();
        for (Candidate c : ranked.candidates) {
            candidates.add(mapOf(c));
        }
        Candidate next = ranked.candidates.stream().filter(c -> c.reason == null).findFirst().orElse(null);
        return Map.of("candidates", candidates, "nextEligible", next == null ? Map.of() : mapOf(next));
    }

    private Map<String, Object> mapOf(Candidate c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("applicationId", c.applicationId);
        m.put("name", c.name);
        m.put("rank", c.rank);
        m.put("eligible", c.reason == null);
        m.put("reason", c.reason);
        return m;
    }

    /** Marks a freed seat as given (on the source offer's cascade id, unused once an offer is declined, expired or withdrawn). */
    private static final String SEAT_GIVEN = "WAITLIST_SEAT:";

    private RankedWaitlist rankedWaitlist(JobOffer source) {
        Map<String, Object> job = jdbc.queryForMap(
                "SELECT j.id, j.college_id, j.category FROM job_application a JOIN job j ON j.id = a.job_id WHERE a.id = :a",
                new MapSqlParameterSource("a", source.getApplicationId()));
        Integer jobId = ((Number) job.get("id")).intValue();
        Integer collegeId = ((Number) job.get("college_id")).intValue();
        boolean dream = job.get("category") != null && String.valueOf(job.get("category")).contains("DREAM");

        // Waitlisted applicants of this drive, best rank first (latest HOLD result decides the rank).
        List<Map<String, Object>> waitlisted = jdbc.queryForList(
                "SELECT a.id AS applicationId, l.id AS learnerId, l.first_name AS firstName, l.last_name AS lastName, " +
                "  COALESCE((SELECT rr.waitlist_rank FROM round_result rr WHERE rr.application_id = a.id AND rr.outcome = 'HOLD' " +
                "    ORDER BY rr.id DESC LIMIT 1), 2147483647) AS rnk " +
                "FROM job_application a JOIN learner l ON l.id = a.learner_id " +
                "WHERE a.job_id = :j AND a.application_status = 'WAITLISTED' ORDER BY rnk, a.id",
                new MapSqlParameterSource("j", jobId));

        List<Candidate> candidates = new ArrayList<>();
        int position = 0;
        for (Map<String, Object> w : waitlisted) {
            position++;
            int learnerId = ((Number) w.get("learnerId")).intValue();
            int applicationId = ((Number) w.get("applicationId")).intValue();
            String name = (w.get("firstName") + " " + (w.get("lastName") == null ? "" : w.get("lastName"))).trim();
            List<BigDecimal> held = jdbc.queryForList(
                    "SELECT COALESCE(o.ctc_lpa, 0) FROM job_offer o JOIN job_application a ON a.id = o.application_id JOIN job hj ON hj.id = a.job_id " +
                    "WHERE a.learner_id = :l AND o.status IN ('RELEASED','ACCEPTED') AND hj.counts_as_placed = 1",
                    new MapSqlParameterSource("l", learnerId), BigDecimal.class);
            // A student already given a seat on this drive (selected or released, still waitlisted until it is released) is not
            // picked again: the next press used to select the same student a second time.
            Long already = jdbc.queryForObject("SELECT COUNT(*) FROM job_offer o WHERE o.application_id = :a AND o.status IN ('SELECTED','PENDING_VERIFICATION','RELEASED')",
                    new MapSqlParameterSource("a", applicationId), Long.class);
            String reason = already != null && already > 0 ? "Already offered a seat"
                    : placementRulesService.isBlockedByHeldOffers(collegeId, learnerId, held, source.getCtcLpa(), dream) ? "Placed elsewhere" : null;
            candidates.add(new Candidate(applicationId, name, position, reason));
        }
        return new RankedWaitlist(candidates);
    }

    private record Candidate(int applicationId, String name, int rank, String reason) {}

    private record RankedWaitlist(List<Candidate> candidates) {
        List<Map<String, Object>> skippedSoFar(Candidate upTo) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Candidate c : candidates) {
                if (c == upTo) break;
                out.add(Map.of("name", c.name, "reason", c.reason));
            }
            return out;
        }
        List<Map<String, Object>> allSkipped() {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Candidate c : candidates) out.add(Map.of("name", c.name, "reason", c.reason));
            return out;
        }
    }
}
