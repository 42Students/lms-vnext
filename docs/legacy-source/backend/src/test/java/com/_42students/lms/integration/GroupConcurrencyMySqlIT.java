package com._42students.lms.integration;

import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupMembershipService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Deterministic multi-transaction races for the generic Groups kernel.
 *
 * <p>These tests intentionally do not use @Transactional/@Rollback: each worker must own a real
 * independent transaction so MySQL row locking/unique constraints are exercised exactly as they
 * are with two browser tabs or two pods.</p>
 */
class GroupConcurrencyMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109001;
    private static final int LEARNER_A = 109011;
    private static final int LEARNER_B = 109012;

    @Autowired
    private LmsGroupRepository groups;

    @Autowired
    private LmsGroupMemberRepository members;

    @Autowired
    private GroupMembershipService membershipService;

    private Long groupId;

    @AfterEach
    void cleanup() {
        if (groupId != null) {
            jdbc.update("delete from lms_group_member_event where group_id = ?", groupId);
            jdbc.update("delete from lms_group_member where group_id = ?", groupId);
            jdbc.update("delete from lms_group_rule where group_id = ?", groupId);
            jdbc.update("delete from lms_group where id = ?", groupId);
        }
        jdbc.update("delete from learner where id in (?, ?)", LEARNER_A, LEARNER_B);
        jdbc.update("delete from college where id = ?", COLLEGE);
        groupId = null;
    }

    private LmsGroup seedGroup(int capacity) {
        seedCollege(COLLEGE, "Concurrency College");
        seedLearner(LEARNER_A, COLLEGE, "RaceLearnerA");
        seedLearner(LEARNER_B, COLLEGE, "RaceLearnerB");

        LmsGroup group = new LmsGroup();
        group.setKind("GENERIC");
        group.setOwnerScope(LmsGroup.SCOPE_COLLEGE);
        group.setCollegeId(COLLEGE);
        group.setName("Race Group");
        group.setStatus(LmsGroup.STATUS_ACTIVE);
        group.setCapacity(capacity);
        group.setActiveCount(0);
        group.setSelfJoinOpenFrom(LocalDateTime.now().minusMinutes(1));
        group.setSelfJoinOpenUntil(LocalDateTime.now().plusMinutes(10));
        group.setConfigJson(java.util.Map.of("allowWaitlist", true, "allowSelfLeave", true));
        group.setCreatedByType("SYSTEM");
        group.setIsDeleted(false);
        group = groups.saveAndFlush(group);
        groupId = group.getId();
        return group;
    }

    @Test
    void twoLearnersRacingForFinalSeatProduceExactlyOneActiveAndOneWaitlisted() throws Exception {
        LmsGroup group = seedGroup(1);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch fire = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<String>> futures = new ArrayList<>();
            for (int learnerId : new int[]{LEARNER_A, LEARNER_B}) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    assertTrue(fire.await(5, TimeUnit.SECONDS));
                    return membershipService.selfJoin(group, learnerId, GroupActor.system()).getState();
                }));
            }

            assertTrue(ready.await(5, TimeUnit.SECONDS));
            fire.countDown();

            List<String> states = new ArrayList<>();
            for (Future<String> future : futures) {
                states.add(future.get(10, TimeUnit.SECONDS));
            }

            assertEquals(1, states.stream().filter(LmsGroupMember.STATE_ACTIVE::equals).count());
            assertEquals(1, states.stream().filter(LmsGroupMember.STATE_WAITLISTED::equals).count());

            LmsGroup reloaded = groups.findById(groupId).orElseThrow();
            assertEquals(1, reloaded.getActiveCount());
            assertEquals(1, members.countByGroupIdAndState(groupId, LmsGroupMember.STATE_ACTIVE));
            assertEquals(1, members.countByGroupIdAndState(groupId, LmsGroupMember.STATE_WAITLISTED));
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void sameLearnerDoubleJoinCannotConsumeTwoSeatsEvenWhenRequestsRace() throws Exception {
        LmsGroup group = seedGroup(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch fire = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    assertTrue(fire.await(5, TimeUnit.SECONDS));
                    try {
                        return membershipService.selfJoin(group, LEARNER_A, GroupActor.system()).getState();
                    } catch (RuntimeException duplicateLoser) {
                        return duplicateLoser;
                    }
                }));
            }

            assertTrue(ready.await(5, TimeUnit.SECONDS));
            fire.countDown();
            for (Future<Object> future : futures) {
                future.get(10, TimeUnit.SECONDS);
            }

            assertEquals(1, members.findByGroupIdOrderByCreatedAtAsc(groupId).size(),
                    "unique membership key must leave exactly one durable row");
            assertEquals(1, members.countByGroupIdAndState(groupId, LmsGroupMember.STATE_ACTIVE));
            assertEquals(1, groups.findById(groupId).orElseThrow().getActiveCount(),
                    "losing duplicate transaction must roll back its atomic seat claim");
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void releasingActiveMemberPromotesOnlyOneWaitlistHeadAndKeepsCounterStable() {
        LmsGroup group = seedGroup(1);
        membershipService.selfJoin(group, LEARNER_A, GroupActor.system());
        membershipService.selfJoin(group, LEARNER_B, GroupActor.system());

        membershipService.leave(group, LEARNER_A, GroupActor.system());

        assertEquals(1, groups.findById(groupId).orElseThrow().getActiveCount());
        assertEquals(1, members.countByGroupIdAndState(groupId, LmsGroupMember.STATE_ACTIVE));
        assertEquals(0, members.countByGroupIdAndState(groupId, LmsGroupMember.STATE_WAITLISTED));
        assertEquals(LmsGroupMember.STATE_REMOVED,
                members.findByGroupIdAndMemberTypeAndMemberId(
                        groupId, LmsGroupMember.TYPE_LEARNER, LEARNER_A).orElseThrow().getState());
        assertEquals(LmsGroupMember.STATE_ACTIVE,
                members.findByGroupIdAndMemberTypeAndMemberId(
                        groupId, LmsGroupMember.TYPE_LEARNER, LEARNER_B).orElseThrow().getState());
    }
}
