package com._42students.lms.service;

import com._42students.lms.dto.bugtracker.BugReportActivityResponse;
import com._42students.lms.dto.bugtracker.BugReportRetestRequest;
import com._42students.lms.dto.bugtracker.BugReportWorkflowRequest;
import com._42students.lms.model.BugReport;
import com._42students.lms.model.BugReportActivity;
import com._42students.lms.repository.BugReportActivityRepository;
import com._42students.lms.repository.BugReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BugTrackerWorkflowService {
    private static final Set<String> STATUSES = Set.of(
            "NEW", "CHECKING", "FIXING", "READY_FOR_RETEST", "CLOSED");
    private static final Set<String> RESOLUTIONS = Set.of(
            "FIXED", "DUPLICATE", "NOT_A_BUG", "CANNOT_REPRODUCE", "WONT_FIX");
    private static final Set<String> AFFECTED_LAYERS = Set.of(
            "FRONTEND", "BACKEND", "BOTH", "UNKNOWN");
    private static final Set<String> REGRESSION_STATUSES = Set.of(
            "NOT_REVIEWED", "NOT_REQUIRED", "PLANNED", "ADDED");
    private static final Set<String> RETEST_RESULTS = Set.of("PASS", "FAIL");

    private final BugReportRepository reportRepository;
    private final BugReportActivityRepository activityRepository;

    public BugTrackerWorkflowService(BugReportRepository reportRepository,
                                     BugReportActivityRepository activityRepository) {
        this.reportRepository = reportRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional
    public void updateWorkflow(String publicId, BugReportWorkflowRequest request) {
        BugReport report = find(publicId);
        String oldStatus = report.getStatus();
        String oldResolution = report.getResolution();

        if (request.getAffectedLayer() != null) {
            report.setAffectedLayer(optionalAllowed(
                    request.getAffectedLayer(), AFFECTED_LAYERS, "affected layer"));
        }
        if (request.getRootCause() != null) {
            report.setRootCause(optionalText(request.getRootCause()));
        }
        if (request.getFixNotes() != null) {
            report.setFixNotes(optionalText(request.getFixNotes()));
        }
        if (request.getFrontendCommitSha() != null) {
            report.setFrontendCommitSha(optionalText(request.getFrontendCommitSha()));
        }
        if (request.getBackendCommitSha() != null) {
            report.setBackendCommitSha(optionalText(request.getBackendCommitSha()));
        }
        if (request.getRegressionTestStatus() != null) {
            report.setRegressionTestStatus(requireAllowed(
                    request.getRegressionTestStatus(), REGRESSION_STATUSES, "regression test status"));
        }
        if (request.getProductionVerified() != null) {
            report.setProductionVerified(request.getProductionVerified());
        }

        String requestedStatus = request.getStatus() == null
                ? null
                : requireAllowed(request.getStatus(), STATUSES, "status");
        boolean resolutionWasProvided = request.getResolution() != null;
        String requestedResolution = resolutionWasProvided
                ? optionalAllowed(request.getResolution(), RESOLUTIONS, "resolution")
                : report.getResolution();

        if (requestedStatus != null) {
            report.setStatus(requestedStatus);
        }

        if (resolutionWasProvided) {
            report.setResolution(requestedResolution);
            if (requestedResolution != null) {
                report.setStatus("CLOSED");
            }
        }

        if ("READY_FOR_RETEST".equals(report.getStatus())) {
            report.setResolution(null);
            report.setRetestStatus("NOT_RETESTED");
            report.setRetestedAt(null);
        } else if (!"CLOSED".equals(report.getStatus())) {
            // Reopening an issue must not carry a stale terminal resolution.
            report.setResolution(null);
        }

        reportRepository.save(report);

        if (!Objects.equals(oldStatus, report.getStatus())) {
            addActivity(report, "STATUS_CHANGED", "Engineering", oldStatus, report.getStatus(), null);
        }
        if (!Objects.equals(oldResolution, report.getResolution())) {
            addActivity(report, "RESOLUTION_CHANGED", "Engineering",
                    oldResolution, report.getResolution(), null);
        }
    }

    @Transactional
    public void updateStatus(String publicId, String status) {
        BugReportWorkflowRequest request = new BugReportWorkflowRequest();
        request.setStatus(status);
        updateWorkflow(publicId, request);
    }

    @Transactional
    public void retest(String publicId, BugReportRetestRequest request) {
        BugReport report = find(publicId);
        if (!"READY_FOR_RETEST".equals(report.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Issue is not ready for retest");
        }
        String result = requireAllowed(request.getResult(), RETEST_RESULTS, "retest result");
        String note = optionalText(request.getNote());
        String oldStatus = report.getStatus();

        report.setRetestStatus(result);
        report.setRetestedAt(LocalDateTime.now());

        if ("PASS".equals(result)) {
            report.setStatus("CLOSED");
            report.setResolution("FIXED");
        } else {
            report.setStatus("FIXING");
            report.setResolution(null);
            report.setProductionVerified(false);
        }

        reportRepository.save(report);
        addActivity(
                report,
                "RETEST",
                report.getReporterName(),
                oldStatus,
                "PASS".equals(result) ? "CLOSED / FIXED" : "FIXING",
                note);
    }

    @Transactional(readOnly = true)
    public List<BugReportActivityResponse> listActivity(String publicId) {
        BugReport report = find(publicId);
        return activityRepository.findByBugReportIdOrderByCreatedAtAsc(report.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private BugReport find(String publicId) {
        String normalized = optionalText(publicId);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found");
        }
        return reportRepository.findByPublicIdIgnoreCase(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));
    }

    private void addActivity(BugReport report,
                             String type,
                             String actor,
                             String from,
                             String to,
                             String note) {
        BugReportActivity activity = new BugReportActivity();
        activity.setBugReportId(report.getId());
        activity.setActivityType(type);
        activity.setActorName(actor);
        activity.setFromValue(from);
        activity.setToValue(to);
        activity.setNote(note);
        activityRepository.save(activity);
    }

    private BugReportActivityResponse toResponse(BugReportActivity activity) {
        return BugReportActivityResponse.builder()
                .id(activity.getId())
                .activityType(activity.getActivityType())
                .actorName(activity.getActorName())
                .fromValue(activity.getFromValue())
                .toValue(activity.getToValue())
                .note(activity.getNote())
                .createdAt(activity.getCreatedAt())
                .build();
    }

    private String requireAllowed(String value, Set<String> allowed, String field) {
        String normalized = canonical(value);
        if (normalized == null || !allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
        return normalized;
    }

    private String optionalAllowed(String value, Set<String> allowed, String field) {
        String normalized = canonical(value);
        if (normalized == null) return null;
        if (!allowed.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
        return normalized;
    }

    private String canonical(String value) {
        String normalized = optionalText(value);
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT);
    }

    private String optionalText(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
