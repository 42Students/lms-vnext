package com._42students.lms.controller.tpo;

import com._42students.lms.model.tpo.JobOffer;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoOfferService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tpo/offers")
public class TpoOfferController {

    private final TpoOfferService offerService;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;

    public TpoOfferController(TpoOfferService offerService, SecurityContextUtil securityContextUtil, TpoAccessGuard guard) {
        this.guard = guard;
        this.offerService = offerService;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    // BE-0048: the TPO's own offer actions go into the Audit Log, with who did them. Optional so hand-built controllers in
    // tests keep working; in the app it is always there.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com._42students.lms.service.tpo.TpoAuditService audit;

    private JobOffer logged(String action, JobOffer offer, String extra) {
        if (audit != null && offer != null) {
            UserPrincipal p = principal();
            String detail = "application " + offer.getApplicationId() + (extra == null || extra.isBlank() ? "" : " — " + extra.trim());
            audit.log(p.getCollegeId(), "TPO", p.getId(), action, "OFFER", offer.getId(), detail);
        }
        return offer;
    }

    public static class RecordSelectionRequest {
        public Integer applicationId;
        public String roleOptionName;
        public BigDecimal ctcLpa;
        public String kind; // LOI | OFFER
    }

    @PostMapping("/record-selection")
    public ResponseEntity<JobOffer> recordSelection(@RequestBody RecordSelectionRequest req) {
        guard.requireApplicationWritable(principal(), req.applicationId);
        JobOffer offer = offerService.recordSelection(req.applicationId, req.roleOptionName, req.ctcLpa,
                req.kind, principal().getId(), "TPO");
        logged("OFFER_SELECTION_RECORDED", offer, (req.kind == null ? "" : req.kind) + (req.roleOptionName == null ? "" : " · " + req.roleOptionName));
        return ResponseEntity.status(HttpStatus.CREATED).body(offer);
    }

    @PostMapping("/{offerId}/letter")
    public ResponseEntity<JobOffer> attachLetter(@PathVariable Long offerId, @RequestBody Map<String, String> body) {
        guard.requireOfferWritable(principal(), offerId);
        String url = body.get("letterUrl");
        return ResponseEntity.ok(logged(url == null || url.isBlank() ? "OFFER_LETTER_REMOVED" : "OFFER_LETTER_ATTACHED", offerService.attachLetter(offerId, url), null));
    }

    @PostMapping("/{offerId}/verify-and-release")
    public ResponseEntity<JobOffer> verifyAndRelease(@PathVariable Long offerId) {
        guard.requireOfferWritable(principal(), offerId);
        return ResponseEntity.ok(logged("OFFER_VERIFIED_RELEASED", offerService.verifyAndRelease(offerId, principal().getId()), null));
    }

    public static class BulkVerifyRequest { public java.util.List<Long> offerIds; }

    /**
     * Verify and release many selections in one call. Each offer is checked against the placement rules on its own, so one that the
     * rules block does not stop the others: the answer lists who was released and, for each that was not, the reason.
     */
    @PostMapping("/bulk-verify")
    public ResponseEntity<java.util.Map<String, Object>> bulkVerify(@RequestBody BulkVerifyRequest req) {
        java.util.List<Long> ids = req == null || req.offerIds == null ? java.util.List.of() : req.offerIds;
        if (ids.size() > 200) throw new IllegalArgumentException("Verify at most 200 selections at a time");
        java.util.List<Long> released = new java.util.ArrayList<>();
        java.util.List<java.util.Map<String, Object>> failed = new java.util.ArrayList<>();
        for (Long id : new java.util.LinkedHashSet<>(ids)) {
            try {
                guard.requireOfferWritable(principal(), id);
                logged("OFFER_VERIFIED_RELEASED", offerService.verifyAndRelease(id, principal().getId()), "bulk");
                released.add(id);
            } catch (RuntimeException e) {
                java.util.Map<String, Object> f = new java.util.LinkedHashMap<>();
                f.put("offerId", id);
                f.put("reason", e.getMessage() == null ? "Could not verify" : e.getMessage());
                failed.add(f);
            }
        }
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("released", released);
        out.put("failed", failed);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/{offerId}/external-acceptance")
    public ResponseEntity<JobOffer> externalAcceptance(@PathVariable Long offerId) {
        guard.requireOfferWritable(principal(), offerId);
        return ResponseEntity.ok(logged("OFFER_EXTERNAL_ACCEPTANCE_RECORDED", offerService.recordExternalAcceptance(offerId, principal().getId()), null));
    }

    @PostMapping("/{offerId}/withdraw")
    public ResponseEntity<JobOffer> withdraw(@PathVariable Long offerId, @RequestBody Map<String, String> body) {
        guard.requireOfferWritable(principal(), offerId);
        return ResponseEntity.ok(logged("OFFER_WITHDRAWN_BY_COMPANY", offerService.withdrawOffer(offerId, body.get("reason"), principal().getId()), body.get("reason")));
    }

    @PostMapping("/{offerId}/joining-status")
    public ResponseEntity<JobOffer> joiningStatus(@PathVariable Long offerId, @RequestBody Map<String, String> body) {
        guard.requireOfferWritable(principal(), offerId);
        return ResponseEntity.ok(logged("OFFER_JOINING_STATUS_SET", offerService.setJoiningStatus(offerId, body.get("status")), body.get("status")));
    }

    @PostMapping("/{offerId}/reverse-acceptance")
    public ResponseEntity<JobOffer> reverse(@PathVariable Long offerId, @RequestBody Map<String, String> body) {
        guard.requireOfferWritable(principal(), offerId);
        return ResponseEntity.ok(logged("OFFER_ACCEPTANCE_REVERSED", offerService.reverseAcceptance(offerId, body.get("reason"), principal().getId()), body.get("reason")));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}
