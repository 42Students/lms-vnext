package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.JobOffer;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoOfferService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * The student's own accept/decline on a job_offer row. Delegates straight to the existing,
 * already-audited JobServiceImpl.respondToOffer for the actual status change (see
 * TpoOfferService.respondInApp) so ownership checks and the accept cascade behave exactly as
 * they do today. Kept as its own small controller instead of touching JobController under time
 * pressure tonight.
 */
@RestController
@RequestMapping("/api/v1/learner/offers")
public class LearnerOfferController {

    private final TpoOfferService offerService;
    private final SecurityContextUtil securityContextUtil;

    public LearnerOfferController(TpoOfferService offerService, SecurityContextUtil securityContextUtil) {
        this.offerService = offerService;
        this.securityContextUtil = securityContextUtil;
    }

    @PostMapping("/{offerId}/respond")
    public ResponseEntity<JobOffer> respond(@PathVariable Long offerId, @RequestBody Map<String, Boolean> body) {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        // Learners only: the principal id is used as the learner id below, and faculty/recruiter ids live in other tables,
        // so a faculty member whose id happened to equal a learner's id could otherwise answer that learner's offer.
        if (p == null || !p.isLearner()) {
            throw new org.springframework.security.access.AccessDeniedException("Only students can respond to offers");
        }
        boolean accept = Boolean.TRUE.equals(body.get("accept"));
        return ResponseEntity.ok(offerService.respondInApp(offerId, p.getId(), accept));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleStateConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }
}
