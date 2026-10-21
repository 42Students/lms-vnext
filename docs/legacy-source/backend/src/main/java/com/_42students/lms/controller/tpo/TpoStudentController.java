package com._42students.lms.controller.tpo;

import com._42students.lms.dto.tpo.StudentSummaryDTO;
import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.model.tpo.PlacementDebarment;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoStudentService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tpo/students")
public class TpoStudentController {

    private final TpoStudentService studentService;
    private final LearnerRepository learnerRepository;
    private final SecurityContextUtil securityContextUtil;
    private final TpoAccessGuard guard;

    public TpoStudentController(TpoStudentService studentService, LearnerRepository learnerRepository,
                                 SecurityContextUtil securityContextUtil, TpoAccessGuard guard) {
        this.guard = guard;
        this.studentService = studentService;
        this.learnerRepository = learnerRepository;
        this.securityContextUtil = securityContextUtil;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    /** Every learner in the caller's college. No search/pagination yet — see BUILD-LOG.md. */
    @GetMapping
    public ResponseEntity<List<StudentSummaryDTO>> list() {
        UserPrincipal p = principal();
        if (p.getCollegeId() == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(learnerRepository.findByCollegeId(p.getCollegeId(), PageRequest.of(0, 5000))
                .getContent().stream().map(StudentSummaryDTO::new).toList());
    }

    /** One-record academic upsert (TPO correction / single fix). Bulk Excel import: V1.1 batch job. */
    @PutMapping("/{learnerId}/academic-record")
    public ResponseEntity<LearnerAcademicRecord> upsertAcademic(@PathVariable Integer learnerId,
                                                                 @RequestBody LearnerAcademicRecord incoming) {
        guard.requireLearner(principal(), learnerId);
        return ResponseEntity.ok(studentService.upsertVerified(learnerId, incoming, null));
    }

    public static class DebarRequest {
        public String reason;
        public LocalDate untilDate;
        public Integer untilDrives;
    }

    @PostMapping("/{learnerId}/debar")
    public ResponseEntity<PlacementDebarment> debar(@PathVariable Integer learnerId, @RequestBody DebarRequest req) {
        guard.requireLearner(principal(), learnerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.debar(learnerId, req.reason, req.untilDate, req.untilDrives, principal().getId()));
    }

    @PostMapping("/debarments/{debarmentId}/lift")
    public ResponseEntity<Void> lift(@PathVariable Long debarmentId, @RequestBody Map<String, String> body) {
        guard.requireDebarment(principal(), debarmentId);
        studentService.liftDebarment(debarmentId, body.get("reason"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{learnerId}/debarments")
    public ResponseEntity<List<PlacementDebarment>> debarments(@PathVariable Integer learnerId) {
        guard.requireLearner(principal(), learnerId);
        return ResponseEntity.ok(studentService.activeDebarments(learnerId));
    }
}
