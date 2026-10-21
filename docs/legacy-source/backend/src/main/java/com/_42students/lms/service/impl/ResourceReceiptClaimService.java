package com._42students.lms.service.impl;

import com._42students.lms.dto.request.ContentDataDTO;
import com._42students.lms.dto.request.FileDTO;
import com._42students.lms.dto.request.ResourceMaterialDTO;
import com._42students.lms.model.AssignmentUploadReceipt;
import com._42students.lms.repository.AssignmentUploadReceiptRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Atomically claims new Resource files in the same DB transaction as the content row. */
@Service
@RequiredArgsConstructor
public class ResourceReceiptClaimService {
    private final AssignmentUploadReceiptRepository receipts;
    private final ContentUrlValidator urlValidator;
    private final SecurityContextUtil security;

    @Transactional(propagation = Propagation.MANDATORY)
    public void claimNewFiles(ContentDataDTO incoming, ContentDataDTO previous, Integer contentId) {
        if (incoming == null || incoming.getResourceMaterials() == null) return;
        if (contentId == null || contentId <= 0) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resource content id unavailable");
        }
        UserPrincipal user = security.getAuthenticatedUserPrincipal();
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Resource uploader is not authenticated");
        }
        Set<String> oldKeys = fileKeys(previous == null ? null : previous.getResourceMaterials());
        Set<String> newlyAttached = new HashSet<>();
        for (ResourceMaterialDTO material : incoming.getResourceMaterials()) {
            if (material == null || !"FILE".equalsIgnoreCase(material.getKind())) continue;
            FileDTO file = material.getFileDTO();
            if (file == null || file.getCloudStorageObject() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file key is required");
            }
            String key = urlValidator.resolveStorageKeyFromValue(file.getCloudStorageObject());
            if (key == null || key.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file key is invalid");
            }
            if (oldKeys.contains(key)) continue;
            if (!newlyAttached.add(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate Resource upload");
            }
            AssignmentUploadReceipt receipt = receipts.findByStorageKeyAndIsDeletedFalse(key)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "A Resource file must have its original uploader receipt"));
            LocalDateTime now = LocalDateTime.now();
            if (!validNewReceipt(receipt, user, key, file, now)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Resource upload receipt is missing, expired, reused or belongs to another uploader");
            }
            // One conditional UPDATE is the linearization point: two concurrent requests
            // cannot both claim the same receipt. A conflict rolls back this content row.
            int claimed = receipts.claimResourceUpload(receipt.getReceiptId(), key, user.getId(),
                    contentId, now);
            if (claimed != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Resource upload was already attached to another content row");
            }
        }
    }

    private Set<String> fileKeys(List<ResourceMaterialDTO> materials) {
        Set<String> keys = new HashSet<>();
        if (materials == null) return keys;
        for (ResourceMaterialDTO material : materials) {
            if (material == null || !"FILE".equalsIgnoreCase(material.getKind())
                    || material.getFileDTO() == null || material.getFileDTO().getCloudStorageObject() == null) continue;
            String key = urlValidator.resolveStorageKeyFromValue(material.getFileDTO().getCloudStorageObject());
            if (key != null) keys.add(key);
        }
        return keys;
    }

    static boolean validNewReceipt(AssignmentUploadReceipt receipt, UserPrincipal user,
                                   String key, FileDTO file, LocalDateTime now) {
        return receipt != null && user != null && user.getId() != null && file != null
                && user.getId().equals(receipt.getOwnerUserId())
                && (user.isFaculty() ? "FACULTY" : user.getUserType()) != null
                && (user.isFaculty() ? "FACULTY" : user.getUserType())
                    .equalsIgnoreCase(receipt.getOwnerUserType() == null ? "" : receipt.getOwnerUserType())
                && "lesson-content".equals(receipt.getFolder())
                && "resource".equalsIgnoreCase(receipt.getUploadType())
                && key.equals(receipt.getStorageKey())
                && receipt.getConsumedAt() == null && receipt.getExpiresAt() != null
                && receipt.getExpiresAt().isAfter(now)
                && receipt.getDeclaredContentLength() != null
                && receipt.getDeclaredContentLength() == file.getSize()
                && file.getMimetype() != null && receipt.getDeclaredContentType() != null
                && receipt.getDeclaredContentType().equalsIgnoreCase(file.getMimetype());
    }
}
