package com._42students.lms.repository;

import com._42students.lms.model.AssignmentUploadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AssignmentUploadReceiptRepository extends JpaRepository<AssignmentUploadReceipt, Integer> {
    Optional<AssignmentUploadReceipt> findByReceiptIdAndIsDeletedFalse(String receiptId);
    Optional<AssignmentUploadReceipt> findByStorageKeyAndIsDeletedFalse(String storageKey);
    boolean existsByStorageKeyAndConsumedAtIsNotNullAndIsDeletedFalse(String storageKey);

    /** Conditional single-row claim; must execute inside the lesson-content transaction. */
    @Modifying(flushAutomatically = true)
    @Query("UPDATE assignment_upload_receipt r SET r.lessonContentId = :contentId, r.consumedAt = :now "
            + "WHERE r.receiptId = :receiptId AND r.storageKey = :storageKey "
            + "AND r.ownerUserId = :ownerId AND r.isDeleted = false "
            + "AND r.folder = 'lesson-content' AND r.uploadType = 'resource' "
            + "AND r.consumedAt IS NULL AND r.expiresAt > :now")
    int claimResourceUpload(@Param("receiptId") String receiptId,
                            @Param("storageKey") String storageKey,
                            @Param("ownerId") Integer ownerId,
                            @Param("contentId") Integer contentId,
                            @Param("now") LocalDateTime now);
}
