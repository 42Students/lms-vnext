package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.LearnerAcademicRecord;
import com._42students.lms.model.tpo.PlacementDebarment;
import com._42students.lms.model.tpo.PlacementRegistration;
import com._42students.lms.repository.tpo.LearnerAcademicRecordRepository;
import com._42students.lms.repository.tpo.PlacementDebarmentRepository;
import com._42students.lms.repository.tpo.PlacementRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Registration, verified academics, and manual debarment. See TPO V1 - Locked.docx §6.
 */
@Service
@RequiredArgsConstructor
public class TpoStudentService {

    private static final String CONSENT_VERSION = "v1";

    private final PlacementRegistrationRepository registrationRepository;
    private final LearnerAcademicRecordRepository academicRecordRepository;
    private final PlacementDebarmentRepository debarmentRepository;

    @Transactional
    public PlacementRegistration register(Integer learnerId, Long seasonId, String choice, String source) {
        if (choice == null || !PlacementOutcomeService.CHOICES.contains(choice)) throw new IllegalArgumentException("Unknown registration choice");
        PlacementRegistration reg = registrationRepository.findByLearnerIdAndSeasonId(learnerId, seasonId)
                .orElseGet(PlacementRegistration::new);
        reg.setLearnerId(learnerId);
        reg.setSeasonId(seasonId);
        reg.setChoice(choice);
        reg.setSource(source);
        if ("PLACEMENTS".equals(choice)) {
            reg.setConsentVersion(CONSENT_VERSION);
            reg.setConsentAt(LocalDateTime.now());
        }
        if (reg.getCreatedAt() == null) reg.setCreatedAt(LocalDateTime.now());
        reg.setUpdatedAt(LocalDateTime.now());
        return registrationRepository.save(reg);
    }

    public Optional<PlacementRegistration> registration(Integer learnerId, Long seasonId) {
        return registrationRepository.findByLearnerIdAndSeasonId(learnerId, seasonId);
    }

    @Transactional
    public LearnerAcademicRecord upsertVerified(Integer learnerId, LearnerAcademicRecord incoming, String importBatchId) {
        LearnerAcademicRecord record = academicRecordRepository.findById(learnerId).orElseGet(() -> {
            LearnerAcademicRecord r = new LearnerAcademicRecord();
            r.setLearnerId(learnerId);
            return r;
        });
        if (incoming.getCgpa() != null) record.setCgpa(incoming.getCgpa());
        if (incoming.getTenthPct() != null) record.setTenthPct(incoming.getTenthPct());
        if (incoming.getTwelfthPct() != null) record.setTwelfthPct(incoming.getTwelfthPct());
        if (incoming.getDiplomaPct() != null) record.setDiplomaPct(incoming.getDiplomaPct());
        if (incoming.getUgPct() != null) record.setUgPct(incoming.getUgPct());
        if (incoming.getGapYears() != null) record.setGapYears(incoming.getGapYears());
        if (incoming.getIsLateralEntry() != null) record.setIsLateralEntry(incoming.getIsLateralEntry());
        if (incoming.getPassingYear() != null) record.setPassingYear(incoming.getPassingYear());
        if (incoming.getGender() != null) record.setGender(incoming.getGender());
        record.setSource("VERIFIED");
        record.setImportBatchId(importBatchId);
        record.setImportedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        return academicRecordRepository.saveAndFlush(record); // flushed: marks_json is written next with JDBC
    }

    @Transactional
    public PlacementDebarment debar(Integer learnerId, String reason, java.time.LocalDate untilDate, Integer untilDrives, Integer createdBy) {
        PlacementDebarment d = new PlacementDebarment();
        d.setLearnerId(learnerId);
        d.setReason(reason);
        d.setUntilDate(untilDate);
        d.setUntilDrives(untilDrives);
        d.setCreatedBy(createdBy);
        d.setCreatedAt(LocalDateTime.now());
        return debarmentRepository.save(d);
    }

    @Transactional
    public void liftDebarment(Long debarmentId, String reason) {
        PlacementDebarment d = debarmentRepository.findById(debarmentId).orElseThrow();
        d.setLiftedAt(LocalDateTime.now());
        d.setLiftedReason(reason);
        debarmentRepository.save(d);
    }

    public boolean isDebarred(Integer learnerId) {
        return debarmentRepository.findByLearnerIdAndLiftedAtIsNull(learnerId).stream().anyMatch(PlacementDebarment::isActive);
    }

    public List<PlacementDebarment> activeDebarments(Integer learnerId) {
        return debarmentRepository.findByLearnerIdAndLiftedAtIsNull(learnerId).stream().filter(PlacementDebarment::isActive).toList();
    }
}
