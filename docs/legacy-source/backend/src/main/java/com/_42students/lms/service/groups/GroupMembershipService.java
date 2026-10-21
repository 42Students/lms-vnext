package com._42students.lms.service.groups;

import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.model.groups.LmsGroupMemberEvent;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.groups.LmsGroupMemberEventRepository;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_CSV;
import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_MANUAL;
import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_RULE;
import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_SELF;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_ACTIVE;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_REMOVED;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_WAITLISTED;
import static com._42students.lms.model.groups.LmsGroupMember.TYPE_LEARNER;

/**
 * Membership: the part of the kernel that has to be exactly right.
 *
 * Invariants
 * - One row per (group, member), forever. Leaving = REMOVED, never a delete. The DB unique key
 *   backs the idempotency check; a lost race surfaces as a 409 and the transaction (including any
 *   seat it claimed) rolls back, so no seat is ever leaked and no duplicate row ever exists.
 * - Capacity is enforced by one atomic UPDATE ({@link LmsGroupRepository#claimSeat}); this code
 *   never compares counts in Java.
 * - A freed ACTIVE seat is offered to the waitlist head in the same transaction.
 * - {@code isLocked} is an explicit admin decision: rule re-runs skip locked rows and a locked
 *   REMOVED row blocks self re-join.
 * - Every transition writes one append-only event.
 *
 * Feature-specific rules (pick limits, clashes, drop deadlines) come in through {@link GroupJoinPolicy}.
 */
@Service
public class GroupMembershipService {

    private static final Set<String> ADMIN_SOURCES = Set.of(SOURCE_MANUAL, SOURCE_CSV, SOURCE_RULE);

    private final LmsGroupRepository groupRepository;
    private final LmsGroupMemberRepository memberRepository;
    private final LmsGroupMemberEventRepository eventRepository;
    private final LearnerRepository learnerRepository;
    private final ObjectProvider<GroupJoinPolicy> policies;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager em;

    // Optional so focused unit tests can construct the service without a Spring context.
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setEventPublisher(org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public GroupMembershipService(LmsGroupRepository groupRepository,
                                  LmsGroupMemberRepository memberRepository,
                                  LmsGroupMemberEventRepository eventRepository,
                                  LearnerRepository learnerRepository,
                                  ObjectProvider<GroupJoinPolicy> policies,
                                  ObjectMapper objectMapper) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.eventRepository = eventRepository;
        this.learnerRepository = learnerRepository;
        this.policies = policies;
        this.objectMapper = objectMapper;
    }

    // ------------------------------------------------------------------ reads

    public List<LmsGroupMember> members(Long groupId, String state) {
        if (state == null || state.isBlank()) return memberRepository.findByGroupIdOrderByCreatedAtAsc(groupId);
        return memberRepository.findByGroupIdAndStateOrderByCreatedAtAsc(groupId, state.trim().toUpperCase());
    }

    public Optional<LmsGroupMember> membership(Long groupId, String memberType, Integer memberId) {
        return memberRepository.findByGroupIdAndMemberTypeAndMemberId(groupId, memberType, memberId);
    }

    /** The hot-path helper future consumers (electives, notifications, ...) call. */
    public List<Long> activeGroupIds(String memberType, Integer memberId) {
        return memberRepository.findActiveGroupIds(memberType, memberId);
    }

    public List<LmsGroupMember> currentMemberships(String memberType, Integer memberId) {
        return memberRepository.findCurrentByMember(memberType, memberId);
    }

    public List<LmsGroupMember> membershipsIn(String memberType, Integer memberId, Collection<Long> groupIds) {
        if (groupIds == null || groupIds.isEmpty()) return List.of();
        return memberRepository.findByMemberInGroups(memberType, memberId, groupIds);
    }

    public List<LmsGroupMemberEvent> events(Long groupId) {
        return eventRepository.findTop200ByGroupIdOrderByCreatedAtDesc(groupId);
    }

    // ------------------------------------------------------------------ admin paths

    /** Manual, CSV or rule add. Works in DRAFT so a roster can be built before opening. */
    @Transactional
    public LmsGroupMember add(LmsGroup group, Integer learnerId, String source, GroupActor actor, String note) {
        String s = source == null ? SOURCE_MANUAL : source.trim().toUpperCase();
        if (!ADMIN_SOURCES.contains(s)) throw new IllegalArgumentException("Source must be MANUAL, CSV or RULE");
        if (LmsGroup.STATUS_ARCHIVED.equals(group.getStatus())) throw new IllegalStateException("Group is archived");
        return join(group, TYPE_LEARNER, learnerId, s, actor, note, true);
    }

    @Transactional
    public LmsGroupMember remove(LmsGroup group, Integer learnerId, GroupActor actor, String reason, boolean lock) {
        LmsGroupMember member = membership(group.getId(), TYPE_LEARNER, learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));
        if (!member.isCurrent()) {
            if (lock && !Boolean.TRUE.equals(member.getIsLocked())) {
                member.setIsLocked(true);
                member = memberRepository.save(member);
                event(group, member, STATE_REMOVED, STATE_REMOVED, member.getSource(), actor, "Locked");
            }
            return member;
        }
        return transitionToRemoved(group, member, actor, reason == null ? "Removed by college" : reason, lock);
    }

    @Transactional
    public LmsGroupMember setLocked(LmsGroup group, Integer learnerId, boolean locked, GroupActor actor) {
        LmsGroupMember member = membership(group.getId(), TYPE_LEARNER, learnerId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));
        if (Boolean.TRUE.equals(member.getIsLocked()) == locked) return member;
        member.setIsLocked(locked);
        member = memberRepository.save(member);
        event(group, member, member.getState(), member.getState(), member.getSource(), actor, locked ? "Locked" : "Unlocked");
        return member;
    }

    /** Recompute the denormalised count from rows. Cheap; safe to run any time. */
    @Transactional
    public int reconcileActiveCount(LmsGroup group) {
        int count = (int) memberRepository.countByGroupIdAndState(group.getId(), STATE_ACTIVE);
        groupRepository.setActiveCount(group.getId(), count);
        return count;
    }

    /**
     * Promotes from the waitlist while seats remain. The seat claim only ever runs when someone
     * LEAVES ({@link #transitionToRemoved}); raising (or unsetting) a group's capacity never did
     * this on its own, so a full group that had waitlisted students stayed stuck at the old
     * capacity until someone happened to drop out. Callers that change capacity upward must call
     * this afterwards. Returns how many were promoted.
     */
    @Transactional
    public int promoteWhileSeatsAvailable(LmsGroup group) {
        int promoted = 0;
        while (promoteNext(group)) {
            promoted++;
        }
        return promoted;
    }

    /** Roll numbers -> learners, confined to the college so a CSV cannot reach across tenants. */
    public List<Learner> resolveRollNumbers(Integer collegeId, Collection<String> rollNumbers) {
        if (collegeId == null || rollNumbers == null || rollNumbers.isEmpty()) return List.of();
        return em.createQuery("select l from learner l where l.collegeId = :collegeId and l.rollNumber in :rolls "
                        + "and (l.isDeleted = false or l.isDeleted is null)", Learner.class)
                .setParameter("collegeId", collegeId)
                .setParameter("rolls", rollNumbers)
                .getResultList();
    }

    // ------------------------------------------------------------------ learner paths

    @Transactional
    public LmsGroupMember selfJoin(LmsGroup group, Integer learnerId, GroupActor actor) {
        if (!LmsGroup.STATUS_ACTIVE.equals(group.getStatus())) throw new IllegalStateException("Group is not open");
        if (!isSelfJoinOpen(group, LocalDateTime.now())) throw new IllegalStateException("Registration window is closed");
        return join(group, TYPE_LEARNER, learnerId, SOURCE_SELF, actor, null, false);
    }

    @Transactional
    public LmsGroupMember leave(LmsGroup group, Integer learnerId, GroupActor actor) {
        if (LmsGroup.STATUS_ARCHIVED.equals(group.getStatus())) throw new IllegalStateException("Group is archived");
        LmsGroupMember member = membership(group.getId(), TYPE_LEARNER, learnerId)
                .filter(LmsGroupMember::isCurrent)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));
        if (Boolean.TRUE.equals(member.getIsLocked())) throw new IllegalStateException("This membership is locked by the college");
        if (!configFlag(group, "allowSelfLeave", true)) throw new IllegalStateException("Leaving is not allowed for this group");
        for (GroupJoinPolicy policy : policies) {
            if (policy.supports(group)) policy.beforeLeave(group, member);
        }
        return transitionToRemoved(group, member, actor, "Left", false);
    }

    // ------------------------------------------------------------------ core

    private LmsGroupMember join(LmsGroup group, String memberType, Integer memberId, String source,
                                GroupActor actor, String note, boolean byAdmin) {
        requireInScope(group, memberType, memberId);
        Optional<LmsGroupMember> existing = membership(group.getId(), memberType, memberId);
        if (existing.isPresent() && existing.get().isCurrent()) return existing.get(); // idempotent
        if (existing.isPresent() && Boolean.TRUE.equals(existing.get().getIsLocked()) && !byAdmin) {
            throw new IllegalStateException("Removed by the college; contact your admin");
        }
        for (GroupJoinPolicy policy : policies) {
            if (policy.supports(group)) policy.beforeJoin(group, memberType, memberId, source);
        }

        boolean seat = groupRepository.claimSeat(group.getId()) == 1;
        if (!seat && !configFlag(group, "allowWaitlist", true)) throw new IllegalStateException("Group is full");

        LmsGroupMember member = existing.orElseGet(LmsGroupMember::new);
        String from = existing.map(LmsGroupMember::getState).orElse(null);
        member.setGroupId(group.getId());
        member.setMemberType(memberType);
        member.setMemberId(memberId);
        member.setSource(source);
        if (note != null && !note.isBlank()) member.setNote(note.trim());
        if (seat) {
            member.setState(STATE_ACTIVE);
            member.setWaitlistPosition(null);
            member.setJoinedAt(LocalDateTime.now());
        } else {
            member.setState(STATE_WAITLISTED);
            member.setWaitlistPosition(memberRepository.maxWaitlistPosition(group.getId()) + 1);
        }
        // A concurrent duplicate hits uk_lms_group_member here; the whole transaction (seat included)
        // rolls back and the client gets a 409 from GroupExceptionAdvice. Nothing to recover.
        member = memberRepository.saveAndFlush(member);
        event(group, member, from, member.getState(), source, actor, null);
        return member;
    }

    private LmsGroupMember transitionToRemoved(LmsGroup group, LmsGroupMember member, GroupActor actor, String reason, boolean lock) {
        String from = member.getState();
        member.setState(STATE_REMOVED);
        member.setWaitlistPosition(null);
        if (lock) member.setIsLocked(true);
        member = memberRepository.save(member);
        if (STATE_ACTIVE.equals(from)) groupRepository.releaseSeat(group.getId());
        event(group, member, from, STATE_REMOVED, member.getSource(), actor, reason);
        if (STATE_ACTIVE.equals(from)) promoteNext(group);
        return member;
    }

    /** Promotes the waitlist head into the freed seat, if any. Returns whether it promoted someone. */
    private boolean promoteNext(LmsGroup group) {
        Optional<LmsGroupMember> head = memberRepository
                .findFirstByGroupIdAndStateOrderByWaitlistPositionAscCreatedAtAsc(group.getId(), STATE_WAITLISTED);
        if (head.isEmpty()) return false;
        if (groupRepository.claimSeat(group.getId()) != 1) return false;
        LmsGroupMember member = head.get();
        member.setState(STATE_ACTIVE);
        member.setWaitlistPosition(null);
        member.setJoinedAt(LocalDateTime.now());
        member = memberRepository.save(member);
        event(group, member, STATE_WAITLISTED, STATE_ACTIVE, member.getSource(), GroupActor.system(), "Promoted from waitlist");
        return true;
    }

    /** Same "Not found" whether the learner is missing, deleted or in another college: no enumeration oracle. */
    private void requireInScope(LmsGroup group, String memberType, Integer memberId) {
        if (!TYPE_LEARNER.equals(memberType)) throw new IllegalArgumentException("Only learners can be group members in this version");
        if (memberId == null) throw new IllegalArgumentException("Learner not found");
        Learner learner = learnerRepository.findById(memberId)
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException("Learner not found"));
        if (group.getCollegeId() != null && !group.getCollegeId().equals(learner.getCollegeId())) {
            throw new IllegalArgumentException("Learner not found");
        }
    }

    private void event(LmsGroup group, LmsGroupMember member, String from, String to, String source, GroupActor actor, String reason) {
        LmsGroupMemberEvent e = new LmsGroupMemberEvent();
        e.setGroupId(group.getId());
        e.setMemberType(member.getMemberType());
        e.setMemberId(member.getMemberId());
        e.setFromState(from);
        e.setToState(to);
        e.setSource(source);
        e.setActorType(actor.type);
        e.setActorId(actor.id);
        e.setReason(reason);
        eventRepository.save(e);
        // Every state change funnels through here, so this is the one place features hear about it
        // (synchronously, in this transaction: a listener that fails rolls the change back too).
        if (eventPublisher != null && !java.util.Objects.equals(from, to)) {
            eventPublisher.publishEvent(new GroupMembershipChangedEvent(
                    group.getId(), member.getMemberType(), member.getMemberId(), from, to));
        }
    }

    // ------------------------------------------------------------------ config helpers

    public Map<String, Object> config(LmsGroup group) {
        if (group.getConfigJson() == null) return Map.of();
        try {
            Map<String, Object> cfg = objectMapper.convertValue(group.getConfigJson(), new TypeReference<Map<String, Object>>() {});
            return cfg == null ? Map.of() : cfg;
        } catch (IllegalArgumentException malformed) {
            return Map.of();
        }
    }

    private boolean configFlag(LmsGroup group, String key, boolean dflt) {
        Object v = config(group).get(key);
        return v instanceof Boolean ? (Boolean) v : dflt;
    }

    public static boolean isSelfJoinOpen(LmsGroup group, LocalDateTime now) {
        if (group.getSelfJoinOpenFrom() == null || now.isBefore(group.getSelfJoinOpenFrom())) return false;
        return group.getSelfJoinOpenUntil() == null || !now.isAfter(group.getSelfJoinOpenUntil());
    }
}
