package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.JobOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {
    List<JobOffer> findByApplicationId(Integer applicationId);

    Optional<JobOffer> findFirstByApplicationIdOrderByCreatedAtDesc(Integer applicationId);

    @Query("SELECT o FROM JobOffer o, JobApplication a WHERE o.applicationId = a.id AND a.job.id = :jobId")
    List<JobOffer> findByJobId(@Param("jobId") Integer jobId);

    /** Every offer across all of one learner's applications — used to compute their held-offer CTC for the rules page's personal line. */
    @Query("SELECT o FROM JobOffer o, JobApplication a WHERE o.applicationId = a.id AND a.learner.id = :learnerId")
    List<JobOffer> findByLearnerId(@Param("learnerId") Integer learnerId);

    @Query("SELECT o FROM JobOffer o WHERE o.status = 'RELEASED' AND o.respondBy < CURRENT_TIMESTAMP")
    List<JobOffer> findExpired();

    /** External-import acceptances whose 48h student-dispute window has closed. */
    @Query("SELECT o FROM JobOffer o WHERE o.status = 'ACCEPTED' AND o.acceptanceChannel = 'EXTERNAL_IMPORT' " +
           "AND o.acceptedDisputableUntil IS NOT NULL AND o.acceptedDisputableUntil < CURRENT_TIMESTAMP")
    List<JobOffer> findExternalAcceptancesPastDisputeWindow();
}
