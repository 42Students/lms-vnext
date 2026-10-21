package com._42students.lms.repository.groups;

import com._42students.lms.model.groups.LmsGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LmsGroupMemberRepository extends JpaRepository<LmsGroupMember, Long> {

    Optional<LmsGroupMember> findByGroupIdAndMemberTypeAndMemberId(Long groupId, String memberType, Integer memberId);

    List<LmsGroupMember> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    List<LmsGroupMember> findByGroupIdAndStateOrderByCreatedAtAsc(Long groupId, String state);

    /** Head of the waitlist: lowest position, then earliest request. */
    Optional<LmsGroupMember> findFirstByGroupIdAndStateOrderByWaitlistPositionAscCreatedAtAsc(Long groupId, String state);

    long countByGroupIdAndState(Long groupId, String state);

    @Query("select coalesce(max(m.waitlistPosition), 0) from LmsGroupMember m where m.groupId = :groupId and m.state = 'WAITLISTED'")
    int maxWaitlistPosition(@Param("groupId") Long groupId);

    /** Everything a person is currently in (any state but REMOVED). */
    @Query("select m from LmsGroupMember m where m.memberType = :memberType and m.memberId = :memberId and m.state <> 'REMOVED' order by m.createdAt desc")
    List<LmsGroupMember> findCurrentByMember(@Param("memberType") String memberType, @Param("memberId") Integer memberId);

    /** The hot-path helper every consumer uses: ids of the groups this person is ACTIVE in. */
    @Query("select m.groupId from LmsGroupMember m where m.memberType = :memberType and m.memberId = :memberId and m.state = 'ACTIVE'")
    List<Long> findActiveGroupIds(@Param("memberType") String memberType, @Param("memberId") Integer memberId);

    @Query("select m from LmsGroupMember m where m.memberType = :memberType and m.memberId = :memberId and m.groupId in :groupIds")
    List<LmsGroupMember> findByMemberInGroups(@Param("memberType") String memberType, @Param("memberId") Integer memberId,
                                              @Param("groupIds") Collection<Long> groupIds);
}
