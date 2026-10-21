package com._42students.lms.service;

import com._42students.lms.dto.bugtracker.BugReportCreateRequest;
import com._42students.lms.dto.bugtracker.BugReportResponse;
import com._42students.lms.model.BugReport;
import com._42students.lms.model.BugTrackerAccess;
import com._42students.lms.repository.BugReportRepository;
import com._42students.lms.repository.BugTrackerAccessRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Set;

@Service
public class BugTrackerService {
    private static final Set<String> ACCOUNT_ROLES = Set.of(
            "LEARNER", "FACULTY", "MENTOR", "COLLEGE_ADMIN", "SUPER_ADMIN", "NOT_SURE");
    private static final Set<String> ENVIRONMENTS = Set.of(
            "LOCAL", "DEVELOPMENT", "UAT", "PRODUCTION", "OTHER", "NOT_SURE");
    private static final Set<String> SEVERITIES = Set.of(
            "BLOCKER", "CRITICAL", "MAJOR", "MINOR", "UI_ONLY", "SUGGESTION", "NOT_SURE");
    private static final Set<String> STATUSES = Set.of(
            "NEW", "CHECKING", "FIXING", "READY_FOR_RETEST", "CLOSED");

    private final BugReportRepository reportRepository;
    private final BugTrackerAccessRepository accessRepository;

    public BugTrackerService(BugReportRepository reportRepository,
                             BugTrackerAccessRepository accessRepository) {
        this.reportRepository = reportRepository;
        this.accessRepository = accessRepository;
    }

    @Transactional
    public BugReportResponse create(BugReportCreateRequest request) {
        String requestedReporter = requireText(request.getReporterName(), "reporter");
        BugTrackerAccess reporter = accessRepository
                .findByDisplayNameIgnoreCaseAndActiveTrue(requestedReporter)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Select a valid reporter"));

        BugReport report = new BugReport();
        report.setReporterAccess(reporter);
        report.setReporterName(reporter.getDisplayName());
        report.setAccountRole(requireAllowed(request.getAccountRole(), ACCOUNT_ROLES, "account role"));
        report.setEnvironment(requireAllowed(request.getEnvironment(), ENVIRONMENTS, "environment"));
        report.setPage(requireText(request.getPage(), "page"));
        report.setScreen(optionalText(request.getScreen()));
        report.setSection(optionalText(request.getSection()));
        report.setIssueType(requireText(request.getIssueType(), "issue type"));
        report.setDescription(requireText(request.getDescription(), "description"));
        report.setSeverity(requireAllowed(request.getSeverity(), SEVERITIES, "severity"));
        report.setEvidenceLink(validateHttpUrl(request.getEvidenceLink(), "Evidence link"));
        report.setSourceUrl(validateHttpUrl(request.getSourceUrl(), "Source URL"));
        report.setSourcePath(optionalText(request.getSourcePath()));
        report.setBrowser(optionalText(request.getBrowser()));
        report.setViewport(optionalText(request.getViewport()));
        report.setStatus("NEW");
        report.setRegressionTestStatus("NOT_REVIEWED");
        report.setProductionVerified(false);
        report.setRetestStatus("NOT_RETESTED");

        BugReport saved = reportRepository.saveAndFlush(report);
        saved.setPublicId(String.format(Locale.ROOT, "LMS-%04d", saved.getId()));
        saved = reportRepository.save(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<BugReportResponse> search(String status, String environment, String reporter,
                                          String search, int page, int size) {
        return search(status, environment, reporter, search, page, size, "DESC");
    }

    @Transactional(readOnly = true)
    public Page<BugReportResponse> search(String status, String environment, String reporter,
                                          String search, int page, int size, String sortDirection) {
        String normalizedStatus = optionalAllowed(status, STATUSES, "status");
        String normalizedEnvironment = optionalAllowed(environment, ENVIRONMENTS, "environment");
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Sort.Direction direction = "ASC".equalsIgnoreCase(optionalText(sortDirection))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return reportRepository.search(
                        normalizedStatus,
                        normalizedEnvironment,
                        optionalText(reporter),
                        optionalText(search),
                        PageRequest.of(safePage, safeSize, Sort.by(direction, "createdAt")))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public BugReportResponse get(String publicId) {
        return toResponse(find(publicId));
    }

    @Transactional
    public BugReportResponse updateStatus(String publicId, String status) {
        BugReport report = find(publicId);
        report.setStatus(requireAllowed(status, STATUSES, "status"));
        return toResponse(reportRepository.save(report));
    }

    private BugReport find(String publicId) {
        String normalized = optionalText(publicId);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found");
        }
        return reportRepository.findByPublicIdIgnoreCase(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));
    }

    private BugReportResponse toResponse(BugReport report) {
        return BugReportResponse.builder()
                .publicId(report.getPublicId())
                .reporterName(report.getReporterName())
                .accountRole(report.getAccountRole())
                .environment(report.getEnvironment())
                .page(report.getPage())
                .screen(report.getScreen())
                .section(report.getSection())
                .issueType(report.getIssueType())
                .description(report.getDescription())
                .severity(report.getSeverity())
                .evidenceLink(report.getEvidenceLink())
                .sourceUrl(report.getSourceUrl())
                .sourcePath(report.getSourcePath())
                .browser(report.getBrowser())
                .viewport(report.getViewport())
                .status(report.getStatus())
                .resolution(report.getResolution())
                .affectedLayer(report.getAffectedLayer())
                .rootCause(report.getRootCause())
                .fixNotes(report.getFixNotes())
                .frontendCommitSha(report.getFrontendCommitSha())
                .backendCommitSha(report.getBackendCommitSha())
                .regressionTestStatus(report.getRegressionTestStatus())
                .productionVerified(report.getProductionVerified())
                .retestStatus(report.getRetestStatus())
                .retestedAt(report.getRetestedAt())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
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

    private String requireText(String value, String field) {
        String normalized = optionalText(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return normalized;
    }

    private String validateHttpUrl(String value, String fieldLabel) {
        String normalized = optionalText(value);
        if (normalized == null) return null;
        try {
            URI uri = new URI(normalized);
            String scheme = uri.getScheme();
            if (scheme == null
                    || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))
                    || uri.getHost() == null
                    || uri.getHost().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, fieldLabel + " must be a valid http or https URL");
            }
            return uri.toASCIIString();
        } catch (URISyntaxException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, fieldLabel + " must be a valid URL");
        }
    }

    private String optionalText(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
