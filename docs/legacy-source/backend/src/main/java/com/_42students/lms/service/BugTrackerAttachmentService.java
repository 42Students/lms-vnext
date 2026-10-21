package com._42students.lms.service;

import com._42students.lms.dto.bugtracker.*;
import com._42students.lms.model.BugReport;
import com._42students.lms.model.BugReportAttachment;
import com._42students.lms.repository.BugReportAttachmentRepository;
import com._42students.lms.repository.BugReportRepository;
import com._42students.lms.utils.R2StorageUtils;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BugTrackerAttachmentService {
    public static final long MAX_IMAGE_BYTES = 8L * 1024L * 1024L;
    public static final int MAX_ATTACHMENTS_PER_ISSUE = 3;

    private final BugReportRepository reportRepository;
    private final BugReportAttachmentRepository attachmentRepository;
    private final ObjectProvider<R2StorageUtils> r2StorageProvider;

    public BugTrackerAttachmentService(BugReportRepository reportRepository,
                                       BugReportAttachmentRepository attachmentRepository,
                                       ObjectProvider<R2StorageUtils> r2StorageProvider) {
        this.reportRepository = reportRepository;
        this.attachmentRepository = attachmentRepository;
        this.r2StorageProvider = r2StorageProvider;
    }

    @Transactional(readOnly = true)
    public BugTrackerAttachmentPresignResponse prepareUpload(
            String publicId,
            BugTrackerAttachmentPresignRequest request) {
        BugReport report = findReport(publicId);
        if (attachmentRepository.countByBugReportId(report.getId()) >= MAX_ATTACHMENTS_PER_ISSUE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This issue already has the maximum number of screenshots");
        }

        String originalName = validateFileName(request.getFileName());
        String contentType = normalizeContentType(request.getContentType());
        long contentLength = request.getContentLength() == null ? 0 : request.getContentLength();
        if (contentLength <= 0 || contentLength > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Screenshot must be between 1 byte and 8 MB");
        }

        String extension = extensionFor(contentType);
        // originalName is intentionally validated even though storage uses a UUID. This prevents
        // path-shaped/control-character names from becoming display metadata at confirmation time.
        if (originalName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Screenshot name is required");
        }

        String key = "bug-tracker/" + report.getPublicId() + "/"
                + UUID.randomUUID() + "." + extension;
        R2StorageUtils storage = requireStorage();
        try {
            String uploadUrl = storage.generatePresignedPutUrl(key, contentType, 15);
            return new BugTrackerAttachmentPresignResponse(uploadUrl, key);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Cannot prepare screenshot upload", e);
        }
    }

    @Transactional
    public BugTrackerAttachmentResponse confirmUpload(
            String publicId,
            BugTrackerAttachmentConfirmRequest request) {
        BugReport report = findReport(publicId);
        String storageKey = request.getStorageKey().trim();
        String expectedPrefix = "bug-tracker/" + report.getPublicId() + "/";
        if (!storageKey.startsWith(expectedPrefix)
                || storageKey.length() <= expectedPrefix.length()
                || storageKey.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid screenshot key");
        }

        BugReportAttachment existing = attachmentRepository.findByStorageKey(storageKey).orElse(null);
        if (existing != null) {
            if (!report.getId().equals(existing.getBugReportId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Screenshot belongs to another issue");
            }
            return toResponse(existing);
        }

        if (attachmentRepository.countByBugReportId(report.getId()) >= MAX_ATTACHMENTS_PER_ISSUE) {
            deleteQuietly(storageKey);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This issue already has the maximum number of screenshots");
        }

        String originalName = validateFileName(request.getOriginalFilename());
        R2StorageUtils storage = requireStorage();
        ObjectMetadata metadata;
        try {
            metadata = storage.getObjectMetadata(storageKey);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded screenshot was not found", e);
        }

        long actualSize = metadata.getContentLength();
        String actualType = normalizeContentType(metadata.getContentType());
        String expectedExtension;
        try {
            expectedExtension = extensionFor(actualType);
        } catch (ResponseStatusException e) {
            deleteQuietly(storageKey);
            throw e;
        }

        if (actualSize <= 0 || actualSize > MAX_IMAGE_BYTES) {
            deleteQuietly(storageKey);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded screenshot exceeds the 8 MB limit");
        }
        if (!storageKey.toLowerCase(Locale.ROOT).endsWith("." + expectedExtension)) {
            deleteQuietly(storageKey);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded screenshot type does not match its key");
        }

        BugReportAttachment attachment = new BugReportAttachment();
        attachment.setBugReportId(report.getId());
        attachment.setStorageKey(storageKey);
        attachment.setOriginalFilename(originalName);
        attachment.setContentType(actualType);
        attachment.setSizeBytes(actualSize);
        return toResponse(attachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public List<BugTrackerAttachmentResponse> list(String publicId) {
        BugReport report = findReport(publicId);
        return attachmentRepository.findByBugReportIdOrderByCreatedAtAsc(report.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private BugReport findReport(String publicId) {
        String normalized = publicId == null ? "" : publicId.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found");
        }
        return reportRepository.findByPublicIdIgnoreCase(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));
    }

    private String validateFileName(String fileName) {
        String normalized = fileName == null ? "" : fileName.trim();
        if (normalized.isEmpty() || normalized.length() > 255
                || normalized.contains("/") || normalized.contains("\\")
                || normalized.chars().anyMatch(c -> c < 32 || c == 127)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid screenshot file name");
        }
        return normalized;
    }

    private String normalizeContentType(String contentType) {
        String normalized = contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
        int semicolon = normalized.indexOf(';');
        if (semicolon >= 0) normalized = normalized.substring(0, semicolon).trim();
        return normalized;
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/jpeg" -> "jpg";
            case "image/webp" -> "webp";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only PNG, JPEG and WebP screenshots are supported");
        };
    }

    private R2StorageUtils requireStorage() {
        R2StorageUtils storage = r2StorageProvider.getIfAvailable();
        if (storage == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Screenshot storage is unavailable");
        }
        return storage;
    }

    private void deleteQuietly(String key) {
        try {
            R2StorageUtils storage = r2StorageProvider.getIfAvailable();
            if (storage != null) storage.deleteFile(key);
        } catch (Exception ignored) {
            // Validation failure must still be returned even when best-effort orphan cleanup fails.
        }
    }

    private BugTrackerAttachmentResponse toResponse(BugReportAttachment attachment) {
        String url = null;
        try {
            R2StorageUtils storage = r2StorageProvider.getIfAvailable();
            if (storage != null) url = storage.getPublicUrl(attachment.getStorageKey());
        } catch (Exception ignored) {
            // The attachment metadata remains visible even if storage URL generation is temporarily down.
        }
        return BugTrackerAttachmentResponse.builder()
                .id(attachment.getId())
                .originalFilename(attachment.getOriginalFilename())
                .contentType(attachment.getContentType())
                .sizeBytes(attachment.getSizeBytes())
                .url(url)
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
