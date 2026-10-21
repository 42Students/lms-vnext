package com._42students.lms.repository.tpo;

import com._42students.lms.model.tpo.RecruiterLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecruiterLeadRepository extends JpaRepository<RecruiterLead, Long> {
    List<RecruiterLead> findByCollegeIdOrderByUpdatedAtDesc(Integer collegeId);

    Optional<RecruiterLead> findFirstByCollegeIdAndEmailNorm(Integer collegeId, String emailNorm);

    Optional<RecruiterLead> findFirstByCollegeIdAndPhoneNorm(Integer collegeId, String phoneNorm);

    Optional<RecruiterLead> findByInviteTokenHash(String inviteTokenHash);

    /**
     * Spends an invite exactly once: only the request that still sees the hash wins (returns 1), so two
     * people racing on the same link cannot both join.
     */
    /** Invites sent at least four days ago, still unopened and unjoined, with an email and no reminder yet (see TpoRecruiterLeadService.sendInviteReminders). */
    @org.springframework.data.jpa.repository.Query("select l from RecruiterLead l where l.inviteSentAt <= :fourDaysAgo and l.inviteSentAt >= :cutoff and l.inviteReminderSentAt is null " +
            "and l.inviteClickedAt is null and l.recruiterId is null and l.unsubscribedAt is null and l.inviteTokenHash is not null and l.emailNorm is not null and l.manualStage <> 'NOT_NOW'")
    List<com._42students.lms.model.tpo.RecruiterLead> findReminderDue(@org.springframework.data.repository.query.Param("fourDaysAgo") java.time.LocalDateTime fourDaysAgo,
                                                             @org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);

    /** BE-0206: the recruiter opened the invite (first time only). An opened invite gets no "still unopened" reminder. */
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("update RecruiterLead l set l.inviteClickedAt = :now where l.id = :id and l.inviteClickedAt is null")
    int markInviteOpened(@org.springframework.data.repository.query.Param("id") Long id,
                         @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("update RecruiterLead l set l.inviteTokenHash = null, l.inviteClickedAt = :now " +
            "where l.id = :id and l.inviteTokenHash = :hash")
    int consumeInvite(@org.springframework.data.repository.query.Param("id") Long id,
                      @org.springframework.data.repository.query.Param("hash") String hash,
                      @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);
}
